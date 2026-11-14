import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { getAdminReports } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/mend/status-badge";
import { Button } from "@/components/ui/button";
import { resolveReport } from "@/lib/actions/admin";
import { DashAlert } from "@/components/dash/dash-alert";
import { SearchBox } from "@/components/dash/search-box";
import { normaliseQuery } from "@/lib/search";

export const metadata: Metadata = { title: "Admin reports" };

type SearchParams = Promise<{ q?: string; ok?: string; error?: string }>;

async function ReportsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireAdmin();
  const query = normaliseQuery(params.q);
  const reports = await getAdminReports(query);

  return (
    <div>
      <div>
        <h1>
          Reports
        </h1>
        <p className="mt-3 text-muted">
          Reports are raised by customers and providers from public profiles and
          job pages. Mark them reviewed or dismissed once handled.
        </p>
      </div>

      {params.ok ? <DashAlert tone="success">{params.ok}</DashAlert> : null}
      {params.error ? <DashAlert tone="danger">{params.error}</DashAlert> : null}

      <div className="mt-6">
        <SearchBox
          action="/admin/reports"
          query={query}
          label="Search reports by type, status or reason"
          placeholder="Type, status or reason"
          resultCount={reports.length}
          noun="report"
        />
      </div>

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
                    <h2 className="capitalize">{report.target_type} report</h2>
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
          {query
            ? `No reports match “${query}”.`
            : "No reports have been raised."}
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
