import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireApprovedProvider } from "@/lib/permissions";
import { getMatchingJobs } from "@/lib/data/jobs";
import { JobCard } from "@/components/mend/job-card";
import { EmptyState } from "@/components/mend/tag";
import { ButtonLink } from "@/components/ui/button";
import { SearchBox } from "@/components/dash/search-box";
import { normaliseQuery } from "@/lib/search";

export const metadata: Metadata = { title: "Matching jobs" };

type SearchParams = Promise<{ q?: string }>;

async function JobsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const context = await requireApprovedProvider();
  const query = normaliseQuery(params.q);
  const jobs = await getMatchingJobs(context.user.id, query);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="dash-kicker">Provider jobs</p>
          <h1 className="mt-2">Jobs that fit your services</h1>
          <p className="mt-3 text-sm text-muted">
            Open jobs in your pilot areas and services. Jobs you have already
            offered on are not shown here.
          </p>
        </div>
        <ButtonLink href="/provide/offers" variant="secondary">
          My offers
        </ButtonLink>
      </div>

      <div className="mt-6">
        <SearchBox
          action="/provide/jobs"
          query={query}
          label="Search matching jobs by title, service or postcode"
          placeholder="Title, service or postcode"
          resultCount={jobs.length}
          noun="job"
        />
      </div>

      {jobs.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              action={
                <Link
                  href={`/jobs/${job.id}`}
                  className="inline-flex min-h-10 items-center rounded-control bg-primary px-4 text-sm font-bold text-primary-fg hover:bg-primary-hover"
                >
                  View and offer
                </Link>
              }
            />
          ))}
        </div>
      ) : query ? (
        <div className="mt-6 rounded-surface border border-line bg-surface p-5">
          <EmptyState
            title="No jobs match your search"
            description={`Nothing in your matching jobs matches “${query}”. Try a different word, or clear the search.`}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-surface border border-line bg-surface p-5">
          <EmptyState
            title="No matching jobs right now"
            description="We will show open jobs here when they match your services and pilot areas. Check back soon."
            action={
              <ButtonLink href="/provide" variant="secondary">
                Update your profile
              </ButtonLink>
            }
          />
        </div>
      )}
    </div>
  );
}

export default function ProviderJobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="dash-page">
      <Suspense
        fallback={
          <div className="space-y-4" aria-hidden>
            <div className="h-12 w-72 rounded bg-slate-100" />
            <div className="h-40 rounded-surface bg-slate-100" />
            <div className="h-40 rounded-surface bg-slate-100" />
          </div>
        }
      >
        <JobsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
