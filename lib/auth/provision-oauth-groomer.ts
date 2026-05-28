import { appendSlugSuffix, slugifyBusinessName } from "@/lib/slug";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

async function ensureProfileRow(params: {
  groomerId: string;
  businessName: string;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", params.groomerId)
    .maybeSingle();

  if (existing) return;

  let bookingSlug = slugifyBusinessName(params.businessName);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const insertProfile = async (slug: string) =>
    supabase.from("profiles").insert({
      id: params.groomerId,
      business_name: params.businessName,
      booking_slug: slug,
      timezone: "America/Los_Angeles",
      subscription_plan: "trial",
      subscription_status: "trialing",
      trial_ends_at: trialEnds.toISOString(),
    });

  const { error } = await insertProfile(bookingSlug);
  if (error?.code === "23505") {
    bookingSlug = appendSlugSuffix(bookingSlug, params.groomerId);
    await insertProfile(bookingSlug);
  }
}

/**
 * Resolve a Supabase auth user id for Google OAuth (create or match by email).
 */
export async function provisionGroomerForGoogleOAuth(params: {
  email: string;
  name?: string | null;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseServiceClient();
  const businessName =
    params.name?.trim() || params.email.split("@")[0] || "My Grooming";

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email: params.email,
      email_confirm: true,
      user_metadata: { business_name: businessName, auth_provider: "google" },
    });

  if (created?.user?.id) {
    await ensureProfileRow({ groomerId: created.user.id, businessName });
    return created.user.id;
  }

  if (createError) {
    const { data: listData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const existing = listData?.users.find(
      (u) => u.email?.toLowerCase() === params.email.toLowerCase(),
    );
    if (existing?.id) {
      await ensureProfileRow({ groomerId: existing.id, businessName });
      return existing.id;
    }
  }

  return null;
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}
