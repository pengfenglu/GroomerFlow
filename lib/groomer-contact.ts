import type { SupabaseClient } from "@supabase/supabase-js";

/** Login email for the groomer (auth.users), used as a public contact for rescheduling. */
export async function getGroomerContactEmail(
  supabase: SupabaseClient,
  groomerId: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.getUserById(groomerId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}
