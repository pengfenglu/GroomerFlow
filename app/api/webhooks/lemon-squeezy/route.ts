import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isLemonSqueezyWebhookConfigured } from "@/lib/lemon-squeezy";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

/** Placeholder: log events and activate subscription on created/updated. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ skipped: true }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (isLemonSqueezyWebhookConfigured() && !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const meta = payload.meta as Record<string, unknown> | undefined;
  const eventName = String(meta?.event_name ?? "unknown");
  const customData = (meta?.custom_data ?? {}) as Record<string, string>;
  const groomerId = customData.groomer_id;

  const supabase = createSupabaseServiceClient();
  await supabase.from("subscription_events").insert({
    groomer_id: groomerId || null,
    provider: "lemon_squeezy",
    event_name: eventName,
    payload,
  });

  const activates = [
    "subscription_created",
    "subscription_updated",
    "subscription_payment_success",
  ];

  if (groomerId && activates.includes(eventName)) {
    const data = payload.data as Record<string, unknown> | undefined;
    const attributes = (data?.attributes ?? {}) as Record<string, unknown>;
    const status = String(attributes.status ?? "active");

    await supabase
      .from("profiles")
      .update({
        subscription_plan: "starter",
        subscription_status: status === "active" ? "active" : "past_due",
      })
      .eq("id", groomerId);
  }

  if (groomerId && eventName === "subscription_cancelled") {
    await supabase
      .from("profiles")
      .update({ subscription_status: "canceled" })
      .eq("id", groomerId);
  }

  return NextResponse.json({ received: true });
}
