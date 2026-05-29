import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/email";
import { formatInProfileTimezone } from "@/lib/timezone";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { one } from "@/lib/supabase/relations";
import { getGroomerContactEmail } from "@/lib/groomer-contact";
import { formatRescheduleMessage } from "@/lib/reschedule-message";

/** Vercel Cron: send day-before reminders. Protect with CRON_SECRET. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ skipped: true, reason: "no supabase" });
  }

  const supabase = createSupabaseServiceClient();
  const now = new Date();
  // Wider window for once-daily Vercel Cron (Hobby). Hourly cron can narrow to 23–25h.
  const windowStart = addHours(now, 20);
  const windowEnd = addHours(now, 28);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      "id, groomer_id, starts_at, pets(name), clients(full_name, email), profiles(business_name, timezone)",
    )
    .eq("status", "confirmed")
    .gte("starts_at", windowStart.toISOString())
    .lte("starts_at", windowEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const appt of appointments ?? []) {
    const client = one(
      appt.clients as
        | { full_name: string; email: string | null }
        | { full_name: string; email: string | null }[],
    );
    const pet = one(appt.pets as { name: string } | { name: string }[]);
    const profile = one(
      appt.profiles as
        | { business_name: string; timezone: string }
        | { business_name: string; timezone: string }[],
    );

    if (!client?.email || !profile) continue;

    const { data: existing } = await supabase
      .from("reminder_logs")
      .select("id")
      .eq("appointment_id", appt.id)
      .eq("kind", "day_before")
      .maybeSingle();

    if (existing) continue;

    const startsAtLocal = formatInProfileTimezone(
      appt.starts_at,
      profile.timezone,
    );

    const groomerEmail = await getGroomerContactEmail(supabase, appt.groomer_id);
    const rescheduleMessage = formatRescheduleMessage({
      businessName: profile.business_name,
      contactEmail: groomerEmail,
    });

    const emailResult = await sendTransactionalEmail({
      to: client.email,
      templateId: "day_before",
      context: {
        businessName: profile.business_name,
        petName: pet?.name ?? "your pet",
        clientName: client.full_name,
        startsAtLocal,
        rescheduleMessage,
      },
    });

    await supabase.from("reminder_logs").insert({
      groomer_id: appt.groomer_id,
      appointment_id: appt.id,
      kind: "day_before",
      channel: "email",
      status: emailResult.ok ? "sent" : "failed",
      sent_at: emailResult.ok ? new Date().toISOString() : null,
    });

    if (emailResult.ok) sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
