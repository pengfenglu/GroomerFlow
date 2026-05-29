import type { SupabaseClient } from "@supabase/supabase-js";
import { fulfillBookingPending } from "@/lib/booking/fulfill-pending";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";

/** Idempotent: webhook may have already created the appointment. */
export async function resolveAppointmentFromStripeSession(
  supabase: SupabaseClient,
  sessionId: string,
  expectedSlug: string,
): Promise<string | null> {
  const { data: bySession } = await supabase
    .from("booking_pending")
    .select("id, appointment_id, status, groomer_id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (bySession?.appointment_id) return bySession.appointment_id;

  if (!isStripeConfigured()) return null;

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.booking_slug !== expectedSlug) return null;

  const pendingId = session.metadata?.pending_id;
  if (!pendingId) return null;

  if (session.status === "complete") {
    const depositCents = session.amount_total ?? 0;
    const result = await fulfillBookingPending(supabase, pendingId, {
      stripeCheckoutSessionId: sessionId,
      depositCents,
      depositStatus: "authorized",
    });
    if ("appointmentId" in result) return result.appointmentId;
  }

  const { data: after } = await supabase
    .from("booking_pending")
    .select("appointment_id")
    .eq("id", pendingId)
    .maybeSingle();

  return after?.appointment_id ?? null;
}
