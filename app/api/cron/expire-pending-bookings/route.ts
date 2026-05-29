import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Release slots held by abandoned Stripe checkouts. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ skipped: true });
  }

  const supabase = createSupabaseServiceClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("booking_pending")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", nowIso)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expired: data?.length ?? 0 });
}
