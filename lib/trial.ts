import type { Profile } from "@/types/database";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function trialDaysRemaining(profile: Pick<Profile, "trial_ends_at">): number | null {
  if (!profile.trial_ends_at) return null;
  const end = new Date(profile.trial_ends_at).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}

export function isTrialExpired(profile: Pick<Profile, "trial_ends_at">): boolean {
  if (!profile.trial_ends_at) return false;
  return new Date(profile.trial_ends_at).getTime() < Date.now();
}

export function isOnActiveSubscription(profile: Pick<Profile, "subscription_status">): boolean {
  return profile.subscription_status === "active";
}

export function shouldShowTrialEndingBanner(
  profile: Pick<Profile, "subscription_plan" | "subscription_status" | "trial_ends_at">,
): boolean {
  if (profile.subscription_plan !== "trial") return false;
  if (isOnActiveSubscription(profile)) return false;
  const days = trialDaysRemaining(profile);
  return days !== null && days <= 3 && days > 0;
}

export function shouldShowTrialExpiredBanner(
  profile: Pick<Profile, "subscription_plan" | "subscription_status" | "trial_ends_at">,
): boolean {
  if (isOnActiveSubscription(profile)) return false;
  if (profile.subscription_plan !== "trial") return false;
  return isTrialExpired(profile);
}

export function formatTrialEndDate(iso: string | null, timezone: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: timezone,
  }).format(new Date(iso));
}
