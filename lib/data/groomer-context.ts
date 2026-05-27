import { requireGroomerId } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function getGroomerContext() {
  const groomerId = await requireGroomerId();
  if (!isSupabaseConfigured()) {
    return { groomerId, supabase: null as ReturnType<typeof createSupabaseServiceClient> | null };
  }
  const supabase = createSupabaseServiceClient();
  return { groomerId, supabase };
}
