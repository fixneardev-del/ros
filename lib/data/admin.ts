import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { matchesQuery, normaliseQuery } from "@/lib/search";
import type { AnalyticsEventRow } from "@/lib/analytics";
import type {
  JobRequest,
  Profile,
  ProviderOffer,
  ProviderProfile,
  ProviderStatus,
  ProviderType,
  Report,
  ServiceCategory,
} from "@/lib/types";

export async function getInterestSignups() {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("interest_signups")
    .select("email, postcode, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []) as Array<{
    email: string;
    postcode: string;
    created_at: string;
  }>;
}

export async function getAdminCounts() {
  if (!isSupabaseConfigured()) {
    return {
      pendingProviders: 0,
      approvedProviders: 0,
      openJobs: 0,
      closedJobs: 0,
      offers: 0,
      openReports: 0,
    };
  }

  const supabase = await createServerSupabase();
  const [pending, approved, openJobs, closedJobs, offers, reports] =
    await Promise.all([
      supabase
        .from("provider_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("provider_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("job_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "receiving_offers"]),
      supabase
        .from("job_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "closed"),
      supabase.from("provider_offers").select("id", { count: "exact", head: true }),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  return {
    pendingProviders: pending.count ?? 0,
    approvedProviders: approved.count ?? 0,
    openJobs: openJobs.count ?? 0,
    closedJobs: closedJobs.count ?? 0,
    offers: offers.count ?? 0,
    openReports: reports.count ?? 0,
  };
}

export async function getAdminProviders(
  status?: string,
  categoryId?: string,
  search?: string,
) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();

  // Filtering an embedded table needs the `!inner` modifier, which also drops
  // providers that do not offer the chosen category.
  // `provider_profiles` has three foreign keys to `profiles` (user, reviewer
  // and suspender), so the embed has to name the one it means. Without the
  // hint PostgREST cannot resolve the relationship and the query fails.
  const services = categoryId
    ? "provider_services!inner(category_id, service_categories(id, name, slug))"
    : "provider_services(category_id, service_categories(id, name, slug))";

  let query = supabase
    .from("provider_profiles")
    .select(
      `*, profiles!provider_profiles_user_id_fkey(full_name), ${services}, provider_photos(*)`,
    );

  if (status) query = query.eq("status", status);
  if (categoryId) query = query.eq("provider_services.category_id", categoryId);

  const { data } = await query.order("created_at", { ascending: true });

  const providers = (data ?? []) as unknown as Array<
    ProviderProfile & {
      profiles: Pick<Profile, "full_name"> | null;
      provider_services: Array<{
        category_id: string;
        service_categories: Pick<ServiceCategory, "id" | "name" | "slug"> | null;
      }>;
      provider_photos: Array<{ id: string; storage_path: string; alt_text: string | null }>;
    }
  >;

  const needle = normaliseQuery(search);
  if (!needle) return providers;

  return providers.filter((provider) =>
    matchesQuery(
      needle,
      provider.display_name,
      provider.bio,
      provider.profiles?.full_name,
      provider.provider_type.replace("_", " "),
      provider.service_districts.join(" "),
      provider.provider_services
        .map((service) => service.service_categories?.name)
        .join(" "),
    ),
  );
}

export async function getAdminJobs(status?: string, search?: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const query = supabase
    .from("job_requests")
    .select(
      // `job_requests` has two foreign keys to `profiles` (customer and the
      // moderator who removed it), so the embed names the one it means.
      "*, profiles!job_requests_customer_id_fkey(full_name), service_categories(id, name, slug), provider_offers!provider_offers_job_id_fkey(count)",
    );

  const { data } = status
    ? await query.eq("status", status).order("created_at", { ascending: false })
    : await query.order("created_at", { ascending: false });

  const jobs = (data ?? []) as unknown as Array<
    JobRequest & {
      profiles: Pick<Profile, "full_name"> | null;
      service_categories: Pick<ServiceCategory, "id" | "name" | "slug"> | null;
      provider_offers: { count: number }[];
    }
  >;

  const needle = normaliseQuery(search);
  if (!needle) return jobs;

  return jobs.filter((job) =>
    matchesQuery(
      needle,
      job.title,
      job.description,
      job.postcode,
      job.postcode_district,
      job.status.replace("_", " "),
      job.profiles?.full_name,
      job.service_categories?.name,
    ),
  );
}

export async function getAdminOffers(search?: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("provider_offers")
    .select(
      "*, provider_profiles(user_id, display_name, provider_type, service_districts, status), job_requests!provider_offers_job_id_fkey(id, title, status, postcode_district)",
    )
    .order("created_at", { ascending: false });

  const offers = (data ?? []) as unknown as Array<
    ProviderOffer & {
      provider_profiles: {
        user_id: string;
        display_name: string;
        provider_type: ProviderType;
        service_districts: string[];
        status: ProviderStatus;
      } | null;
      job_requests: Pick<JobRequest, "id" | "title" | "status" | "postcode_district"> | null;
    }
  >;

  const needle = normaliseQuery(search);
  if (!needle) return offers;

  return offers.filter((offer) =>
    matchesQuery(
      needle,
      offer.message,
      offer.status,
      offer.provider_profiles?.display_name,
      offer.job_requests?.title,
      offer.job_requests?.postcode_district,
      offer.indicative_price_pence === null
        ? null
        : (offer.indicative_price_pence / 100).toFixed(2),
    ),
  );
}

export async function getAdminUsers() {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as Profile[];
}

export async function getAdminReports(search?: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  const reports = (data ?? []) as Report[];
  const needle = normaliseQuery(search);
  if (!needle) return reports;

  return reports.filter((report) =>
    matchesQuery(
      needle,
      report.target_type,
      report.reason,
      report.status,
      report.target_id,
    ),
  );
}

export async function getAnalyticsSummary(days = 30) {
  if (!isSupabaseConfigured()) {
    return { totals: {} as Record<string, number>, total: 0, recent: [] as AnalyticsEventRow[] };
  }

  const supabase = await createServerSupabase();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [totals, events, recent] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("analytics_events")
      .select("event")
      .gte("created_at", since)
      .limit(5000),
    supabase
      .from("analytics_events")
      .select("id, event, path, props, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const totalByEvent: Record<string, number> = {};
  for (const row of (events.data ?? []) as Array<{ event: string }>) {
    totalByEvent[row.event] = (totalByEvent[row.event] ?? 0) + 1;
  }

  return {
    totals: totalByEvent,
    total: totals.count ?? 0,
    recent: (recent.data ?? []) as unknown as AnalyticsEventRow[],
  };
}
