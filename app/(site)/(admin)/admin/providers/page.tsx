import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { getAdminProviders } from "@/lib/data/admin";
import { getCategories } from "@/lib/data/categories";
import { StatusBadge } from "@/components/mend/status-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { DashAlert } from "@/components/dash/dash-alert";

export const metadata: Metadata = { title: "Admin providers" };

type SearchParams = Promise<{
  status?: string;
  category?: string;
  ok?: string;
  error?: string;
}>;

const filters = [
  { value: "", label: "All" },
  { value: "pending", label: "Waiting for review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Not approved" },
  { value: "suspended", label: "Suspended" },
];

async function ProvidersContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireAdmin();
  const status = params.status ?? "";
  const category = params.category ?? "";
  const [providers, categories] = await Promise.all([
    getAdminProviders(status || undefined, category || undefined),
    getCategories(true),
  ]);

  const filterHref = (nextStatus: string) => {
    const search = new URLSearchParams();
    if (nextStatus) search.set("status", nextStatus);
    if (category) search.set("category", category);
    const query = search.toString();
    return query ? `/admin/providers?${query}` : "/admin/providers";
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>
            Providers
          </h1>
          <p className="mt-3 text-muted">
            Review applications and manage approved provider profiles.
          </p>
        </div>
        <ButtonLink href="/api/admin/export/providers" variant="secondary">
          Export CSV
        </ButtonLink>
      </div>

      {params.ok ? <DashAlert tone="success">{params.ok}</DashAlert> : null}
      {params.error ? <DashAlert tone="danger">{params.error}</DashAlert> : null}

      <nav aria-label="Filter providers" className="dash-pills mt-6">
        {filters.map((filter) => {
          const active = status === filter.value;
          return (
            <Link
              key={filter.label}
              href={filterHref(filter.value)}
              aria-current={active ? "page" : undefined}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <form
        method="get"
        className="mt-4 flex flex-wrap items-end gap-3"
        aria-label="Filter providers by service"
      >
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-bold text-ink"
          >
            Service
          </label>
          <select
            id="category"
            name="category"
            defaultValue={category}
            className="mt-1 block min-h-11 rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All services</option>
            {categories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.parent_id ? "— " : ""}
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Apply filter
        </Button>
        {category ? (
          <Link
            href={filterHref(status)}
            className="inline-flex min-h-11 items-center text-sm font-bold text-primary underline underline-offset-4"
          >
            Clear service filter
          </Link>
        ) : null}
      </form>

      {providers.length > 0 ? (
        <div className="mt-6 space-y-4">
          {providers.map((provider) => (
            <article
              key={provider.user_id}
              className="rounded-surface border border-line bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/providers/${provider.user_id}`}
                    className="text-xl font-bold text-primary underline underline-offset-4"
                  >
                    {provider.display_name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {provider.profiles?.full_name ?? "No account name"} ·{" "}
                    {provider.provider_type.replace("_", " ")}
                  </p>
                </div>
                <StatusBadge kind="provider" status={provider.status} />
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold">Pilot areas</dt>
                  <dd className="text-muted">
                    {provider.service_districts.join(", ") || "None selected"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold">Services</dt>
                  <dd className="text-muted">
                    {provider.provider_services
                      .map((service) => service.service_categories?.name)
                      .filter(Boolean)
                      .join(", ") || "None selected"}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/admin/providers/${provider.user_id}`}
                className="mt-4 inline-block text-sm font-bold text-primary underline underline-offset-4"
              >
                Open application
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-surface border border-line bg-surface p-5 text-muted">
          No providers match this filter.
        </p>
      )}
    </div>
  );
}

export default function AdminProvidersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden>
          <div className="h-12 w-64 rounded bg-slate-100" />
          <div className="h-40 rounded-surface bg-slate-100" />
          <div className="h-40 rounded-surface bg-slate-100" />
        </div>
      }
    >
      <ProvidersContent searchParams={searchParams} />
    </Suspense>
  );
}
