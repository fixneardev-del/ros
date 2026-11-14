import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ProviderPhoto, ProviderProfile, ServiceCategory } from "@/lib/types";

export interface ProviderServiceRow {
  category_id: string;
  service_categories: Pick<ServiceCategory, "id" | "name" | "slug"> | null;
}

export interface ProviderWithRelations extends ProviderProfile {
  profiles: { full_name: string } | null;
  provider_services: ProviderServiceRow[];
  provider_photos: ProviderPhoto[];
}

export async function searchProviders(categoryId: string, childIds: string[], district: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("provider_profiles")
    .select(
      "user_id, display_name, bio, price_note, provider_type, service_districts, provider_services(category_id), provider_photos(storage_path, alt_text, sort_order)",
    )
    .eq("status", "approved")
    .contains("service_districts", [district]);

  const rows = (data ?? []) as unknown as Array<
    Pick<
      ProviderProfile,
      "user_id" | "display_name" | "bio" | "price_note" | "provider_type" | "service_districts"
    > & {
      provider_services: { category_id: string }[];
      provider_photos: ProviderPhoto[];
    }
  >;

  const wanted = new Set([categoryId, ...childIds]);

  return rows
    .filter((row) =>
      row.provider_services.some((service) => wanted.has(service.category_id)),
    )
    .map((row) => ({
      ...row,
      photo_path:
        [...row.provider_photos].sort((a, b) => a.sort_order - b.sort_order)[0]
          ?.storage_path ?? null,
      categories: row.provider_services
        .map((service) => service.category_id)
        .filter((id) => wanted.has(id)),
    }));
}

// `provider_profiles` has three foreign keys to `profiles` (user, reviewer and
// suspender), so the embed has to name the one it means. Without the hint
// PostgREST cannot resolve the relationship and the query fails.
const providerSelect =
  "*, profiles!provider_profiles_user_id_fkey(full_name), provider_services(category_id, service_categories(id, name, slug)), provider_photos(*)";

export async function getProviderById(providerId: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("provider_profiles")
    .select(providerSelect)
    .eq("user_id", providerId)
    .maybeSingle();

  return (data as unknown as ProviderWithRelations | null) ?? null;
}

export async function getProviderForOwner(providerId: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("provider_profiles")
    .select(providerSelect)
    .eq("user_id", providerId)
    .maybeSingle();

  return (data as unknown as ProviderWithRelations | null) ?? null;
}
