import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { assertServiceRoleEnv, assertSupabasePublicEnv } from "@/lib/supabase/env";

/** Authenticated server client (RLS as logged-in user). */
export async function createSupabaseServerClient() {
  const { url, anonKey } = assertSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from Server Component; middleware will refresh session.
        }
      },
    },
  });
}

/** Service role — server-only (public booking writes, public page reads). */
export function createSupabaseServiceClient() {
  const { url, serviceRoleKey } = assertServiceRoleEnv();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
