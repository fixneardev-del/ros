import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

const CACHE_TTL_MS = 60_000;

let cached: { value: boolean; expiresAt: number } | null = null;

/**
 * Analytics are off until an admin switches them on in the admin area. The
 * switch is the `analytics_provider` site setting. `first-party` means our
 * own cookie free collector.
 */
export async function isAnalyticsEnabled() {
  if (!isSupabaseConfigured()) return false;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "analytics_provider")
    .maybeSingle();

  const value = (data as { value: string } | null)?.value === "first-party";
  cached = { value, expiresAt: Date.now() + CACHE_TTL_MS };

  return value;
}
