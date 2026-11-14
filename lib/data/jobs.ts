import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { matchesQuery, normaliseQuery } from "@/lib/search";
import type {
  JobPhoto,
  JobRequest,
  ProviderOffer,
  ServiceCategory,
} from "@/lib/types";

export interface OfferWithProvider extends ProviderOffer {
  provider_profiles: { display_name: string; user_id: string } | null;
}

export interface JobWithRelations extends JobRequest {
  service_categories: Pick<
    ServiceCategory,
    "id" | "name" | "slug" | "parent_id"
  > | null;
  job_photos: JobPhoto[];
  provider_offers?: OfferWithProvider[];
}

export async function getCustomerJobs(customerId: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("job_requests")
    .select(
      "*, service_categories(id, name, slug), provider_offers!provider_offers_job_id_fkey(count)",
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as Array<
    JobWithRelations & { provider_offers: { count: number }[] }
  >;
}

export async function getJobWithOffers(jobId: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("job_requests")
    .select(
      "*, service_categories(id, name, slug, parent_id), job_photos(*), provider_offers!provider_offers_job_id_fkey(*, provider_profiles(user_id, display_name, provider_type, service_districts, status))",
    )
    .eq("id", jobId)
    .maybeSingle();

  return (data as unknown as JobWithRelations | null) ?? null;
}

export async function getJobPhotos(paths: string[]) {
  if (paths.length === 0 || !isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase.storage
    .from("job-photos")
    .createSignedUrls(paths, 60 * 60);

  return (data ?? []).map((item) => ({
    path: item.path,
    url: item.signedUrl,
  }));
}

export async function getProviderServices(providerId: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("provider_services")
    .select("category_id")
    .eq("provider_id", providerId);

  return ((data ?? []) as { category_id: string }[]).map((row) => row.category_id);
}

export async function getProviderServiceDistricts(providerId: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("provider_profiles")
    .select("service_districts, status")
    .eq("user_id", providerId)
    .maybeSingle();

  return (data as { service_districts: string[]; status: string } | null) ?? null;
}

/**
 * A provider covers a job category when they offer that exact category or its
 * parent. This mirrors the RLS rule used for job visibility and offers.
 */
export function providerCoversCategory(
  providerCategoryIds: string[],
  jobCategory: Pick<ServiceCategory, "id" | "parent_id">,
) {
  return (
    providerCategoryIds.includes(jobCategory.id) ||
    (jobCategory.parent_id ? providerCategoryIds.includes(jobCategory.parent_id) : false)
  );
}

export async function getMatchingJobs(providerId: string, search?: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const [profile, services] = await Promise.all([
    getProviderServiceDistricts(providerId),
    getProviderServices(providerId),
  ]);

  if (!profile || profile.status !== "approved" || profile.service_districts.length === 0) {
    return [];
  }

  const { data } = await supabase
    .from("job_requests")
    .select(
      "*, service_categories(id, name, slug, parent_id), provider_offers!provider_offers_job_id_fkey(count)",
    )
    .in("status", ["open", "receiving_offers"])
    .in("postcode_district", profile.service_districts)
    .order("created_at", { ascending: false });

  const jobs = (data ?? []) as unknown as Array<
    JobWithRelations & { provider_offers: { count: number }[] }
  >;

  const matching = jobs.filter(
    (job) =>
      job.service_categories &&
      providerCoversCategory(services, {
        id: job.service_categories.id,
        parent_id: (job.service_categories as { parent_id?: string | null }).parent_id ?? null,
      }),
  );

  const { data: myOffers } = await supabase
    .from("provider_offers")
    .select("job_id")
    .eq("provider_id", providerId);

  const offered = new Set(((myOffers ?? []) as { job_id: string }[]).map((row) => row.job_id));

  const open = matching.filter((job) => !offered.has(job.id));

  const needle = normaliseQuery(search);
  if (!needle) return open;

  return open.filter((job) =>
    matchesQuery(
      needle,
      job.title,
      job.description,
      job.postcode,
      job.postcode_district,
      job.service_categories?.name,
    ),
  );
}

export async function getProviderOffers(providerId: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("provider_offers")
    .select(
      "*, job_requests!provider_offers_job_id_fkey(id, title, status, postcode_district, service_categories(id, name, slug))",
    )
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as Array<
    ProviderOffer & {
      job_requests:
        | (Pick<JobRequest, "id" | "title" | "status" | "postcode_district"> & {
            service_categories: Pick<ServiceCategory, "id" | "name" | "slug"> | null;
          })
        | null;
    }
  >;
}

export async function getContactDetails(offerId: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("get_contact_for_accepted_offer", {
    p_offer_id: offerId,
  });

  if (error) return [];
  return (data ?? []) as Array<{
    party: string;
    full_name: string;
    email: string;
    phone: string | null;
  }>;
}
