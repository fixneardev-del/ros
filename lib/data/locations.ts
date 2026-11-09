import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { LocationRow } from "@/lib/types";

export async function getDistricts(includeDisabled = false) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const query = supabase.from("locations").select("*");
  const { data } = includeDisabled
    ? await query.order("postcode_district")
    : await query.eq("is_enabled", true).order("postcode_district");

  return (data ?? []) as LocationRow[];
}

export async function isDistrictEnabled(district: string) {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("locations")
    .select("id")
    .eq("postcode_district", district)
    .eq("is_enabled", true)
    .maybeSingle();

  return Boolean(data);
}
