import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { getAdminReports } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/mend/status-badge";
import { StitchLine } from "@/components/mend/tag";
import { Button } from "@/components/ui/button";
import { resolveReport } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Admin reports" };

type SearchParams = Promise<{ ok?: string; error?: string }>;

async function ReportsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireAdmin();
  const reports = await getAdminReports();

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-extrabold md:text-5xl">
          Reports
        </h1>
        <StitchLine className="mt-4 w-20" />
        <p className="mt-3 text-muted">
          Reports are raised by customers and providers from public profiles and
          job pages. Mark them reviewed or dismissed once handled.
        </p>
      </div>

      {params.ok ? (
        <p className="mt-6 rounded-control bg-success-bg p-4 text-sm font-bold text-success-fg">
          {params.ok}
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-6 rounded-control bg-danger-bg p-4 text-sm font-bold text-danger-fg">
          {params.error}
        </p>
      ) : null}

      {reports.length > 0 ? (
        <div className="mt-6 space-y-4">
          {reports.map((report) => {
            const targetHref =
              report.target_type === "job"
                ? `/jobs/${report.target_id}`
                : `/providers/${report.target_id}`;
            return (
              <article
                key={report.id}
                className="rounded-surface border border-line bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold capitalize">
                      {report.target_type} report
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {formatDate(report.created_at)} ·{" "}
                      <Link
                        href={targetHref}
                        className="font-bold text-primary underline underline-offset-4"
                      >
                        Open reported {report.target_type}
                      </Link>
                    </p>
                  </div>
                  <StatusBadge kind="report" status={report.status} />
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-6">
                  {report.reason}
                </p>

                {report.status === "open" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={resolveReport}>
                      <input type="hidden" name="id" value={report.id} />
                      <input type="hidden" name="status" value="reviewed" />
                      <Button type="submit" className="min-h-10 px-4 text-sm">
                        Mark reviewed
                      </Button>
                    </form>
                    <form action={resolveReport}>
                      <input type="hidden" name="id" value={report.id} />
                      <input type="hidden" name="status" value="dismissed" />
                      <Button
                        type="submit"
                        variant="secondary"
                        className="min-h-10 px-4 text-sm"
                      >
                        Dismiss
                      </Button>
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 rounded-surface border border-line bg-surface p-5 text-muted">
          No reports have been raised.
        </p>
      )}
    </div>
  );
}

export default function AdminReportsPage({
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
        </div>
      }
    >
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}
