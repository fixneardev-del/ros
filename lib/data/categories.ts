import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ServiceCategory } from "@/lib/types";

export async function getCategories(includeInactive = false) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const query = supabase.from("service_categories").select("*");
  const { data } = includeInactive
    ? await query.order("sort_order", { ascending: true })
    : await query
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

  return (data ?? []) as ServiceCategory[];
}

export async function getCategoryAndChildren(categoryId: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabase();
  const { data: category } = await supabase
    .from("service_categories")
    .select("*")
    .eq("id", categoryId)
    .maybeSingle();

  if (!category) return null;

  const { data: children } = await supabase
    .from("service_categories")
    .select("id")
    .eq("parent_id", categoryId);

  return {
    category: category as ServiceCategory,
    ids: [category.id as string, ...((children ?? []) as { id: string }[]).map((row) => row.id)],
  };
}

export async function getCategoryBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("service_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return (data as ServiceCategory | null) ?? null;
}
