import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicAppointment, type PublicBookInput } from "@/lib/booking/public-booking";
import type { DepositStatus } from "@/types/database";

export async function fulfillBookingPending(
  supabase: SupabaseClient,
  pendingId: string,
  options: {
    stripeCheckoutSessionId: string;
    depositStatus: DepositStatus;
    depositCents: number;
  },
): Promise<{ appointmentId: string } | { error: string }> {
  const { data: pending, error } = await supabase
    .from("booking_pending")
    .select("*")
    .eq("id", pendingId)
    .maybeSingle();

  if (error || !pending) {
    return { error: "Pending booking not found" };
  }

  if (pending.status === "completed" && pending.appointment_id) {
    return { appointmentId: pending.appointment_id };
  }

  if (pending.status !== "pending") {
    return { error: `Pending booking is ${pending.status}` };
  }

  if (new Date(pending.expires_at).getTime() < Date.now()) {
    await supabase
      .from("booking_pending")
      .update({ status: "expired" })
      .eq("id", pendingId);
    return { error: "Checkout expired" };
  }

  const input = pending.payload as PublicBookInput;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, business_name, timezone, deposit_enabled, deposit_cents")
    .eq("id", pending.groomer_id)
    .single();

  if (!profile) return { error: "Groomer not found" };

  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes, name")
    .eq("id", pending.service_id)
    .single();

  if (!service) return { error: "Service not found" };

  const { appointmentId } = await createPublicAppointment(supabase, {
    ctx: {
      profile: {
        id: profile.id,
        business_name: profile.business_name,
        timezone: profile.timezone,
        deposit_enabled: profile.deposit_enabled,
        deposit_cents: profile.deposit_cents,
      },
      service,
      startsAt: new Date(pending.starts_at),
      endsAt: new Date(pending.ends_at),
    },
    input,
    depositCents: options.depositCents,
    depositStatus: options.depositStatus,
    stripeCheckoutSessionId: options.stripeCheckoutSessionId,
    sendConfirmationEmail: true,
  });

  await supabase
    .from("booking_pending")
    .update({
      status: "completed",
      appointment_id: appointmentId,
      stripe_checkout_session_id: options.stripeCheckoutSessionId,
    })
    .eq("id", pendingId);

  return { appointmentId };
}
