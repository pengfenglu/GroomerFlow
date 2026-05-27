import type { SubscriptionPlan } from "@/types/database";

export type GatedFeature =
  | "sms"
  | "rebooking"
  | "accounting"
  | "owner_portal";

/** MVP: always allow; Phase 3+ gate by plan. */
export function canAccessFeature(
  plan: SubscriptionPlan,
  feature: GatedFeature,
): boolean {
  void plan;
  void feature;
  return true;
}
