import { NextResponse } from "next/server";
import { z } from "zod";
import { addMinutes } from "date-fns";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  resolvePublicBookContext,
  type PublicBookInput,
} from "@/lib/booking/public-booking";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isStripeConfigured, resolveDepositCents } from "@/lib/stripe/config";
import { getStripeClient } from "@/lib/stripe/client";
import { getPublicAppOrigin } from "@/lib/site";
import { formatPriceCents } from "@/lib/timezone";

const checkoutSchema = z.object({
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

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Online deposits are not configured yet." },
      { status: 503 },
    );
  }

  const json = await request.json();
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data as PublicBookInput;
  const supabase = createSupabaseServiceClient();
  const resolved = await resolvePublicBookContext(supabase, input);

  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const { profile, service, startsAt, endsAt } = resolved.ctx;

  if (!profile.deposit_enabled) {
    return NextResponse.json(
      { error: "This groomer does not require a deposit. Book without payment." },
      { status: 400 },
    );
  }

  const depositCents = resolveDepositCents(profile.deposit_cents);
  const expiresAt = addMinutes(new Date(), 30);

  const { data: pending, error: pendingError } = await supabase
    .from("booking_pending")
    .insert({
      groomer_id: profile.id,
      service_id: service.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      payload: input,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (pendingError || !pending) {
    return NextResponse.json(
      { error: pendingError?.message ?? "Could not reserve slot" },
      { status: 500 },
    );
  }

  const origin = getPublicAppOrigin();
  const stripe = getStripeClient();
  const depositLabel = formatPriceCents(depositCents);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: depositCents,
            product_data: {
              name: `Appointment deposit — ${profile.business_name}`,
              description: `${depositLabel} hold for ${service.name} (manual capture; charged only if no-show per groomer policy).`,
            },
          },
        },
      ],
      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          pending_id: pending.id,
          groomer_id: profile.id,
          booking_slug: input.slug,
        },
      },
      metadata: {
        pending_id: pending.id,
        groomer_id: profile.id,
        booking_slug: input.slug,
      },
      success_url: `${origin}/book/${input.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book/${input.slug}?cancelled=1`,
    });

    await supabase
      .from("booking_pending")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", pending.id);

    return NextResponse.json({
      ok: true,
      checkout_url: session.url,
      deposit_cents: depositCents,
    });
  } catch (err) {
    await supabase
      .from("booking_pending")
      .update({ status: "cancelled" })
      .eq("id", pending.id);

    const message = err instanceof Error ? err.message : "Stripe checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
