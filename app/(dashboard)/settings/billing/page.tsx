import Link from "next/link";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { getProfileForGroomer } from "@/lib/data/profile";
import {
  formatTrialEndDate,
  isOnActiveSubscription,
  trialDaysRemaining,
} from "@/lib/trial";
import {
  getLemonSqueezyCheckoutUrl,
  isLemonSqueezyCheckoutConfigured,
} from "@/lib/lemon-squeezy";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireGroomerId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const profile = await getProfileForGroomer();
  if (!profile) return <SetupNotice />;

  const groomerId = await requireGroomerId();
  const daysLeft = trialDaysRemaining(profile);
  const trialEnd = formatTrialEndDate(profile.trial_ends_at, profile.timezone);
  const checkoutUrl = getLemonSqueezyCheckoutUrl(groomerId);
  const lemonReady = isLemonSqueezyCheckoutConfigured();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-green-800 hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-600">
          Subscription via Lemon Squeezy (Merchant of Record).
        </p>
      </div>

      <Card>
        <CardTitle>Your plan</CardTitle>
        <CardDescription className="mt-1">
          Plan: <span className="font-medium text-slate-800">{profile.subscription_plan}</span>
          {" · "}
          Status:{" "}
          <span className="font-medium text-slate-800">{profile.subscription_status}</span>
        </CardDescription>
        <CardContent className="mt-4 space-y-3 text-sm text-slate-700">
          {profile.subscription_plan === "trial" && !isOnActiveSubscription(profile) ? (
            <>
              <p>
                <span className="font-medium">Trial ends:</span> {trialEnd}
                {daysLeft !== null ? ` (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)` : null}
              </p>
              <p className="text-slate-600">
                You will receive email reminders before your 14-day trial ends. After
                subscribing, Lemon Squeezy webhooks update your account automatically.
              </p>
            </>
          ) : (
            <p>Thank you for subscribing. Manage invoices in your Lemon Squeezy receipt emails.</p>
          )}

          {lemonReady && checkoutUrl ? (
            <Button asChild>
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                Subscribe with Lemon Squeezy
              </a>
            </Button>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
              Set <code className="text-xs">NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL</code> on
              the server to show the subscribe button. Webhook endpoint:{" "}
              <code className="text-xs">/api/webhooks/lemon-squeezy</code>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Booking deposits (Stripe)</CardTitle>
        <CardDescription className="mt-1">
          Configure deposit amounts under Settings → Booking deposit.
        </CardDescription>
        <CardContent className="mt-3">
          <Link href="/settings" className="text-sm text-green-800 hover:underline">
            Go to Settings →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
