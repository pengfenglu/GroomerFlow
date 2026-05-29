import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { fulfillBookingPending } from "@/lib/booking/fulfill-pending";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const pendingId = session.metadata?.pending_id;
  if (!pendingId || !session.id) return;

  const depositCents = session.amount_total ?? 0;
  const supabase = createSupabaseServiceClient();

  await fulfillBookingPending(supabase, pendingId, {
    stripeCheckoutSessionId: session.id,
    depositCents,
    depositStatus: "authorized",
  });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const pendingId = session.metadata?.pending_id;
  if (!pendingId) return;

  const supabase = createSupabaseServiceClient();
  await supabase
    .from("booking_pending")
    .update({ status: "expired" })
    .eq("id", pendingId)
    .eq("status", "pending");
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET missing" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripeClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("[stripe-webhook]", event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
