import { addMinutes, parseISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/lib/email";
import {
  fetchActiveAppointments,
  findOrCreateClientAndPet,
  hasAppointmentConflict,
} from "@/lib/booking";
import { getGroomerContactEmail } from "@/lib/groomer-contact";
import { formatRescheduleMessage } from "@/lib/reschedule-message";
import { formatDepositCustomerNote } from "@/lib/deposit-copy";
import { formatInProfileTimezone } from "@/lib/timezone";
import { getPublicAppOrigin } from "@/lib/site";
import type { DepositStatus } from "@/types/database";

export type PublicBookInput = {
  slug: string;
  service_id: string;
  starts_at: string;
  full_name: string;
  phone?: string;
  email: string;
  pet_name: string;
  pet_breed?: string;
  notes?: string;
};

export type GroomerBookProfile = {
  id: string;
  business_name: string;
  timezone: string;
  deposit_enabled: boolean;
  deposit_cents: number;
};

export type ResolvedBookContext = {
  profile: GroomerBookProfile;
  service: { id: string; duration_minutes: number; name: string };
  startsAt: Date;
  endsAt: Date;
};

/** Pending checkouts block the slot until expiry. */
export async function fetchPendingSlotBlockers(
  supabase: SupabaseClient,
  groomerId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("booking_pending")
    .select("starts_at, ends_at, status")
    .eq("groomer_id", groomerId)
    .eq("status", "pending")
    .gt("expires_at", nowIso)
    .lt("starts_at", rangeEnd.toISOString())
    .gt("ends_at", rangeStart.toISOString());

  if (error) throw error;
  return (data ?? []).map((row) => ({
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: "confirmed" as const,
  }));
}

export async function resolvePublicBookContext(
  supabase: SupabaseClient,
  input: PublicBookInput,
): Promise<
  | { ok: true; ctx: ResolvedBookContext }
  | { ok: false; status: number; error: string }
> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, business_name, timezone, deposit_enabled, deposit_cents, booking_slug",
    )
    .eq("booking_slug", input.slug)
    .single();

  if (profileError || !profile) {
    return { ok: false, status: 404, error: "Groomer not found" };
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_minutes, is_active, name")
    .eq("id", input.service_id)
    .eq("groomer_id", profile.id)
    .single();

  if (serviceError || !service || !service.is_active) {
    return { ok: false, status: 400, error: "Service not available" };
  }

  const startsAt = parseISO(input.starts_at);
  const endsAt = addMinutes(startsAt, service.duration_minutes);

  const [appointments, pending] = await Promise.all([
    fetchActiveAppointments(supabase, profile.id, startsAt, endsAt),
    fetchPendingSlotBlockers(supabase, profile.id, startsAt, endsAt),
  ]);

  const blockers = [...appointments, ...pending];
  if (hasAppointmentConflict(blockers, startsAt, endsAt)) {
    return {
      ok: false,
      status: 409,
      error: "This time slot is no longer available.",
    };
  }

  return {
    ok: true,
    ctx: {
      profile: {
        id: profile.id,
        business_name: profile.business_name,
        timezone: profile.timezone,
        deposit_enabled: profile.deposit_enabled,
        deposit_cents: profile.deposit_cents,
      },
      service: {
        id: service.id,
        duration_minutes: service.duration_minutes,
        name: service.name,
      },
      startsAt,
      endsAt,
    },
  };
}

export async function createPublicAppointment(
  supabase: SupabaseClient,
  params: {
    ctx: ResolvedBookContext;
    input: PublicBookInput;
    depositCents: number;
    depositStatus: DepositStatus;
    stripeCheckoutSessionId?: string | null;
    sendConfirmationEmail: boolean;
  },
): Promise<{ appointmentId: string; startsAtLocal: string }> {
  const { ctx, input } = params;
  const { profile, service, startsAt, endsAt } = ctx;

  const { clientId, petId } = await findOrCreateClientAndPet(supabase, profile.id, {
    full_name: input.full_name,
    phone: input.phone,
    email: input.email,
    pet_name: input.pet_name,
    pet_breed: input.pet_breed,
  });

  const { data: appointment, error: apptError } = await supabase
    .from("appointments")
    .insert({
      groomer_id: profile.id,
      client_id: clientId,
      pet_id: petId,
      service_id: service.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
      source: "public_booking",
      notes: input.notes?.trim() || null,
      deposit_cents: params.depositCents,
      deposit_status: params.depositStatus,
      stripe_checkout_session_id: params.stripeCheckoutSessionId ?? null,
    })
    .select("id")
    .single();

  if (apptError) throw apptError;

  const startsAtLocal = formatInProfileTimezone(startsAt, profile.timezone);

  if (params.sendConfirmationEmail) {
    await supabase.from("reminder_logs").insert({
      groomer_id: profile.id,
      appointment_id: appointment.id,
      kind: "confirmation",
      channel: "email",
      status: "pending",
    });

    const calendarUrl = `${getPublicAppOrigin()}/api/calendar/ics?appointment_id=${appointment.id}`;
    const groomerEmail = await getGroomerContactEmail(supabase, profile.id);
    const rescheduleMessage = formatRescheduleMessage({
      businessName: profile.business_name,
      contactEmail: groomerEmail,
    });
    const depositNote = formatDepositCustomerNote(
      params.depositCents,
      params.depositStatus,
    );

    const emailResult = await sendTransactionalEmail({
      to: input.email,
      templateId: "confirmation",
      context: {
        businessName: profile.business_name,
        petName: input.pet_name,
        clientName: input.full_name,
        startsAtLocal,
        notes: input.notes,
        calendarUrl,
        rescheduleMessage,
        depositNote: depositNote ?? undefined,
      },
    });

    await supabase
      .from("reminder_logs")
      .update({
        status: emailResult.ok ? "sent" : "failed",
        sent_at: emailResult.ok ? new Date().toISOString() : null,
      })
      .eq("appointment_id", appointment.id)
      .eq("kind", "confirmation");
  }

  return { appointmentId: appointment.id, startsAtLocal };
}
