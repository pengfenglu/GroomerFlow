import { NextResponse } from "next/server";
import { z } from "zod";
import { addMinutes, parseISO } from "date-fns";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  fetchActiveAppointments,
  findOrCreateClientAndPet,
  hasAppointmentConflict,
} from "@/lib/booking";
import { sendTransactionalEmail } from "@/lib/email";
import { formatInProfileTimezone } from "@/lib/timezone";
import { getPublicAppOrigin } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const bookSchema = z.object({
  slug: z.string().min(2),
  service_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  full_name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email(),
  pet_name: z.string().min(1),
  pet_breed: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Booking is unavailable. Server configuration missing." },
      { status: 503 },
    );
  }

  const json = await request.json();
  const parsed = bookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const supabase = createSupabaseServiceClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, business_name, timezone")
    .eq("booking_slug", input.slug)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Groomer not found" }, { status: 404 });
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_minutes, is_active, name")
    .eq("id", input.service_id)
    .eq("groomer_id", profile.id)
    .single();

  if (serviceError || !service || !service.is_active) {
    return NextResponse.json({ error: "Service not available" }, { status: 400 });
  }

  const startsAt = parseISO(input.starts_at);
  const endsAt = addMinutes(startsAt, service.duration_minutes);

  const existing = await fetchActiveAppointments(
    supabase,
    profile.id,
    startsAt,
    endsAt,
  );

  if (hasAppointmentConflict(existing, startsAt, endsAt)) {
    return NextResponse.json(
      { error: "This time slot is no longer available." },
      { status: 409 },
    );
  }

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
    })
    .select("id")
    .single();

  if (apptError) {
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }

  await supabase.from("reminder_logs").insert({
    groomer_id: profile.id,
    appointment_id: appointment.id,
    kind: "confirmation",
    channel: "email",
    status: "pending",
  });

  const startsAtLocal = formatInProfileTimezone(
    startsAt,
    profile.timezone,
  );

  const calendarUrl = `${getPublicAppOrigin()}/api/calendar/ics?appointment_id=${appointment.id}`;

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

  return NextResponse.json({
    ok: true,
    appointment_id: appointment.id,
    starts_at_local: startsAtLocal,
  });
}
