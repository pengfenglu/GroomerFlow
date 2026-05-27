import { auth, requireGroomerId } from "@/lib/auth";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { appendSlugSuffix, slugifyBusinessName } from "@/lib/slug";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/types/database";

async function createProfileForGroomer(params: {
  groomerId: string;
  businessName: string;
  timezone: string;
}): Promise<Profile | null> {
  const supabase = createSupabaseServiceClient();
  let bookingSlug = slugifyBusinessName(params.businessName);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const insertProfile = async (slug: string) =>
    supabase
      .from("profiles")
      .insert({
        id: params.groomerId,
        business_name: params.businessName,
        booking_slug: slug,
        timezone: params.timezone,
        subscription_plan: "trial",
        subscription_status: "trialing",
        trial_ends_at: trialEnds.toISOString(),
      })
      .select("*")
      .single();

  let { data, error } = await insertProfile(bookingSlug);

  if (error?.code === "23505") {
    bookingSlug = appendSlugSuffix(bookingSlug, params.groomerId);
    ({ data, error } = await insertProfile(bookingSlug));
  }

  if (error || !data) return null;
  return data as Profile;
}

/** Load profile; repair accounts created before `profiles` table existed. */
export async function getProfileForGroomer(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const groomerId = await requireGroomerId();
  const { supabase } = await getGroomerContext();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", groomerId)
    .maybeSingle();

  if (!error && data) return data as Profile;

  const session = await auth();
  const businessName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "My Grooming";

  return createProfileForGroomer({
    groomerId,
    businessName,
    timezone: "America/Los_Angeles",
  });
}
