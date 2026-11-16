import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, MapPin, MessageSquare } from "lucide-react";
import type { JobStatus } from "@/lib/types";
import { timeframeLabels, TIMEFRAMES } from "@/lib/schemas/job";
import { StatusBadge } from "@/components/mend/status-badge";

export interface JobCardJob {
  id: string;
  title: string;
  postcode_district: string;
  timeframe: string;
  status: JobStatus;
  cancelled_at?: string | null;
  completed_at?: string | null;
  service_categories?: { name: string } | null;
  provider_offers?: { count: number }[];
}

function timeframeLabel(value: string) {
  return TIMEFRAMES.includes(value as (typeof TIMEFRAMES)[number])
    ? timeframeLabels[value as (typeof TIMEFRAMES)[number]]
    : value;
}

export function JobCard({
  job,
  action,
}: {
  job: JobCardJob;
  action?: ReactNode;
}) {
  const offers = job.provider_offers?.[0]?.count ?? 0;

  return (
    <article className="tag">
      <div className="pr-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="job" status={job.status} />
          {job.completed_at ? (
            <span className="rounded-full bg-success-bg px-3 py-1 text-sm font-bold text-success-fg">
              Completed
            </span>
          ) : null}
          {job.cancelled_at && !job.completed_at ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
              Cancelled
            </span>
          ) : null}
          {job.service_categories ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">
              {job.service_categories.name}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-lg font-bold">
          <Link href={`/jobs/${job.id}`} className="hover:underline">
            {job.title}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {job.postcode_district}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {timeframeLabel(job.timeframe)}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="size-4" aria-hidden />
            {offers} {offers === 1 ? "offer" : "offers"}
          </span>
        </div>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </article>
  );
}
