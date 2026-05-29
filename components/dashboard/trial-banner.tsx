import Link from "next/link";
import {
  formatTrialEndDate,
  shouldShowTrialExpiredBanner,
  shouldShowTrialEndingBanner,
  trialDaysRemaining,
} from "@/lib/trial";
import type { Profile } from "@/types/database";

type TrialBannerProps = {
  profile: Profile;
};

export function TrialBanner({ profile }: TrialBannerProps) {
  const ending = shouldShowTrialEndingBanner(profile);
  const ended = shouldShowTrialExpiredBanner(profile);

  if (!ending && !ended) return null;

  const days = trialDaysRemaining(profile);
  const endLabel = formatTrialEndDate(profile.trial_ends_at, profile.timezone);

  if (ended) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Your free trial has ended</p>
        <p className="mt-1">
          Trial ended on {endLabel}. Subscribe to keep using GroomerFlow cloud
          features.
        </p>
        <Link
          href="/settings/billing"
          className="mt-2 inline-block font-medium text-red-800 underline"
        >
          View billing →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">
        Trial ends in {days} day{days === 1 ? "" : "s"}
      </p>
      <p className="mt-1">
        Your 14-day trial ends on {endLabel}. Subscribe before it ends to avoid
        interruption.
      </p>
      <Link
        href="/settings/billing"
        className="mt-2 inline-block font-medium text-amber-900 underline"
      >
        View billing →
      </Link>
    </div>
  );
}
