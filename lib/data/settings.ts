import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

export async function getSiteSettings() {
  if (!isSupabaseConfigured()) return {};

  const supabase = await createServerSupabase();
  const { data } = await supabase.from("site_settings").select("key, value");

  return Object.fromEntries(
    ((data ?? []) as { key: string; value: string }[]).map((row) => [row.key, row.value]),
  );
}

export async function getSiteSetting(key: string, fallback = "") {
  if (!isSupabaseConfigured()) return fallback;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  return (data as { value: string } | null)?.value ?? fallback;
}
