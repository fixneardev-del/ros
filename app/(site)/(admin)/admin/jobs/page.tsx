import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { getAdminJobs } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/mend/status-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { removeJob } from "@/lib/actions/admin";
import { DashAlert } from "@/components/dash/dash-alert";
import { SearchBox } from "@/components/dash/search-box";
import { normaliseQuery } from "@/lib/search";

export const metadata: Metadata = { title: "Admin jobs" };

type SearchParams = Promise<{
  status?: string;
  q?: string;
  ok?: string;
  error?: string;
}>;

const filters = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "receiving_offers", label: "Receiving offers" },
  { value: "closed", label: "Closed" },
  { value: "removed", label: "Removed" },
];

async function JobsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireAdmin();
  const status = params.status ?? "";
  const query = normaliseQuery(params.q);
  const jobs = await getAdminJobs(status || undefined, query);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>
            Jobs
          </h1>
          <p className="mt-3 text-muted">
            Moderate job requests. Removing a job hides it from providers and
            emails the customer.
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
          <ButtonLink href="/api/admin/export/jobs" variant="secondary">
            Export CSV
          </ButtonLink>
          <SearchBox
            action="/admin/jobs"
            query={query}
            label="Search jobs by title, customer or postcode"
            placeholder="Title, customer or postcode"
            hidden={{ status }}
            resultCount={jobs.length}
            noun="job"
          />
        </div>
      </div>

      {params.ok ? <DashAlert tone="success">{params.ok}</DashAlert> : null}
      {params.error ? <DashAlert tone="danger">{params.error}</DashAlert> : null}

      <nav aria-label="Filter jobs" className="dash-pills mt-6">
        {filters.map((filter) => {
          const active = status === filter.value;
          const search = new URLSearchParams();
          if (filter.value) search.set("status", filter.value);
          if (query) search.set("q", query);
          const queryString = search.toString();
          const href = queryString ? `/admin/jobs?${queryString}` : "/admin/jobs";
          return (
            <Link
              key={filter.label}
              href={href}
              aria-current={active ? "page" : undefined}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {jobs.length > 0 ? (
        <div className="mt-6 space-y-4">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-surface border border-line bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-xl font-bold text-primary underline underline-offset-4"
                  >
                    {job.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {job.profiles?.full_name ?? "Unknown customer"} ·{" "}
                    {job.postcode_district} ·{" "}
                    {job.service_categories?.name ?? "Uncategorised"} ·{" "}
                    {formatDate(job.created_at)}
                  </p>
                </div>
                <StatusBadge kind="job" status={job.status} />
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-muted">
                {job.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold">
                  {job.provider_offers?.[0]?.count ?? 0} offers
                </span>
                {job.removed_reason ? (
                  <span className="text-danger-fg">
                    Removed: {job.removed_reason}
                  </span>
                ) : null}
              </div>

              {job.status !== "removed" ? (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-bold text-danger-fg">
                    Remove this job
                  </summary>
                  <form action={removeJob} className="mt-3 max-w-xl space-y-3">
                    <input type="hidden" name="id" value={job.id} />
                    <label
                      htmlFor={`remove-${job.id}`}
                      className="block text-sm font-bold"
                    >
                      Reason
                    </label>
                    <textarea
                      id={`remove-${job.id}`}
                      name="reason"
                      rows={2}
                      minLength={10}
                      maxLength={500}
                      required
                      className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button type="submit" variant="destructive">
                      Remove job
                    </Button>
                  </form>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-surface border border-line bg-surface p-5 text-muted">
          {query ? `No jobs match “${query}”.` : "No jobs match this filter."}
        </p>
      )}
    </div>
  );
}

export default function AdminJobsPage({
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
      <JobsContent searchParams={searchParams} />
    </Suspense>
  );
}
