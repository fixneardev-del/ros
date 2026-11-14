import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, CheckCircle2, MessageSquare } from "lucide-react";
import { requireUser } from "@/lib/permissions";
import { getCustomerJobs } from "@/lib/data/jobs";
import { JobCard } from "@/components/mend/job-card";
import { EmptyState } from "@/components/mend/tag";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "My jobs" };

async function JobsContent() {
  const context = await requireUser("/jobs");
  const jobs = await getCustomerJobs(context.user.id);

  const openJobs = jobs.filter(
    (job) => job.status === "open" || job.status === "receiving_offers",
  ).length;
  const closedJobs = jobs.filter((job) => job.status === "closed").length;
  const offers = jobs.reduce(
    (total, job) => total + (job.provider_offers?.[0]?.count ?? 0),
    0,
  );

  const stats = [
    {
      label: "Open jobs",
      value: openJobs,
      Icon: Briefcase,
      tone: "blue",
    },
    {
      label: "Offers received",
      value: offers,
      Icon: MessageSquare,
      tone: "orange",
    },
    {
      label: "Closed jobs",
      value: closedJobs,
      Icon: CheckCircle2,
      tone: "green",
    },
  ];

  return (
    <div>
      <div>
        <h1>My jobs</h1>
        <p className="mt-2 text-muted">
          Jobs you have posted, with their status and offers.
        </p>
      </div>

      <div className="dash-kpi-grid dash-kpi-grid-3 mt-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`dash-kpi dash-kpi-${stat.tone}`}>
            <div className="dash-kpi-top">
              <span className="dash-kpi-label">{stat.label}</span>
              <span className="dash-kpi-icon">
                <stat.Icon aria-hidden />
              </span>
            </div>
            <p className="dash-kpi-value">{stat.value}</p>
            <span className="dash-kpi-meta">Across your jobs</span>
          </div>
        ))}
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
    <div className="dash-page">
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
