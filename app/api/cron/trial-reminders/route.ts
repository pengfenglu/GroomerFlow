import { NextResponse } from "next/server";
import { addDays, addHours } from "date-fns";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getGroomerContactEmail } from "@/lib/groomer-contact";
import { sendGroomerEmail } from "@/lib/groomer-email";
import { formatTrialEndDate } from "@/lib/trial";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getPublicAppOrigin } from "@/lib/site";

/** Vercel Cron: trial ending soon + trial ended emails. */
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
  const endingSoonStart = addHours(now, 48);
  const endingSoonEnd = addDays(now, 4);
  const billingUrl = `${getPublicAppOrigin()}/settings/billing`;

  let sentEndingSoon = 0;
  let sentEnded = 0;

  const { data: endingSoonProfiles } = await supabase
    .from("profiles")
    .select("id, business_name, timezone, trial_ends_at, subscription_status")
    .eq("subscription_plan", "trial")
    .neq("subscription_status", "active")
    .gte("trial_ends_at", endingSoonStart.toISOString())
    .lte("trial_ends_at", endingSoonEnd.toISOString());

  for (const profile of endingSoonProfiles ?? []) {
    const { data: existing } = await supabase
      .from("trial_reminder_logs")
      .select("id")
      .eq("groomer_id", profile.id)
      .eq("kind", "ending_soon")
      .maybeSingle();

    if (existing) continue;

    const email = await getGroomerContactEmail(supabase, profile.id);
    if (!email) continue;

    const trialEndsAtLabel = formatTrialEndDate(
      profile.trial_ends_at,
      profile.timezone,
    );
    const daysRemaining = profile.trial_ends_at
      ? Math.max(
          0,
          Math.ceil(
            (new Date(profile.trial_ends_at).getTime() - now.getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        )
      : 0;

    const result = await sendGroomerEmail({
      to: email,
      templateId: "trial_ending_soon",
      context: {
        businessName: profile.business_name,
        trialEndsAtLabel,
        daysRemaining,
        billingUrl,
      },
    });

    if (result.ok) {
      await supabase.from("trial_reminder_logs").insert({
        groomer_id: profile.id,
        kind: "ending_soon",
      });
      sentEndingSoon += 1;
    }
  }

  const { data: endedProfiles } = await supabase
    .from("profiles")
    .select("id, business_name, timezone, trial_ends_at, subscription_status")
    .eq("subscription_plan", "trial")
    .neq("subscription_status", "active")
    .lt("trial_ends_at", now.toISOString());

  for (const profile of endedProfiles ?? []) {
    const { data: existing } = await supabase
      .from("trial_reminder_logs")
      .select("id")
      .eq("groomer_id", profile.id)
      .eq("kind", "ended")
      .maybeSingle();

    if (existing) continue;

    const email = await getGroomerContactEmail(supabase, profile.id);
    if (!email) continue;

    const trialEndsAtLabel = formatTrialEndDate(
      profile.trial_ends_at,
      profile.timezone,
    );

    const result = await sendGroomerEmail({
      to: email,
      templateId: "trial_ended",
      context: {
        businessName: profile.business_name,
        trialEndsAtLabel,
        billingUrl,
      },
    });

    if (result.ok) {
      await supabase.from("trial_reminder_logs").insert({
        groomer_id: profile.id,
        kind: "ended",
      });
      sentEnded += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    sent_ending_soon: sentEndingSoon,
    sent_ended: sentEnded,
  });
}
