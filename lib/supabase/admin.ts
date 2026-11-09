import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@/lib/env";

/**
 * Server-only client for system tasks. Returns null when the service role key
 * is absent so local development can run without elevated credentials.
 */
export function createAdminSupabase() {
  const { supabaseUrl } = getPublicEnv();
  const { serviceRoleKey } = getServerEnv();

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
