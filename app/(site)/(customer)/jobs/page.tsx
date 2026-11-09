import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/permissions";
import { getCustomerJobs } from "@/lib/data/jobs";
import { JobCard } from "@/components/mend/job-card";
import { EmptyState, StitchLine } from "@/components/mend/tag";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "My jobs" };

async function JobsContent() {
  const context = await requireUser("/jobs");
  const jobs = await getCustomerJobs(context.user.id);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold md:text-5xl">
            My jobs
          </h1>
          <StitchLine className="mt-4 w-20" />
          <p className="mt-3 text-muted">
            Jobs you have posted, with their status and offers.
          </p>
        </div>
        <ButtonLink href="/post-job">Post a job</ButtonLink>
      </div>

      {jobs.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              action={
                <Link
                  href={`/jobs/${job.id}`}
                  className="inline-flex min-h-10 items-center rounded-control border border-primary px-4 text-sm font-bold text-primary hover:bg-info-bg"
                >
                  Open job
                </Link>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No jobs yet"
          description="Post your first job and matching approved providers can send you an offer."
          action={<ButtonLink href="/post-job">Post a job</ButtonLink>}
        />
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 lg:px-12">
      <Suspense
        fallback={
          <div className="space-y-4" aria-hidden>
            <div className="h-12 w-64 rounded bg-slate-100" />
            <div className="h-40 rounded-surface bg-slate-100" />
            <div className="h-40 rounded-surface bg-slate-100" />
          </div>
        }
      >
        <JobsContent />
      </Suspense>
    </div>
  );
}
