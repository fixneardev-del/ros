import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { getAnalyticsSummary } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { StitchLine } from "@/components/mend/tag";
import { isAnalyticsEnabled } from "@/lib/analytics-server";

export const metadata: Metadata = { title: "Admin analytics" };

const eventLabels: Record<string, string> = {
  page_view: "Page views",
  search: "Searches",
  job_posted: "Jobs posted",
  provider_applied: "Provider applications",
};

async function AnalyticsContent() {
  await requireAdmin();
  const [summary, enabled] = await Promise.all([
    getAnalyticsSummary(30),
    isAnalyticsEnabled(),
  ]);

  const events = Object.keys(eventLabels);

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-extrabold md:text-5xl">
          Analytics
        </h1>
        <StitchLine className="mt-4 w-20" />
        <p className="mt-3 max-w-[70ch] text-muted">
          First party, cookie free events from the last 30 days. No IP address,
          no user id and no third party script are stored.
        </p>
      </div>

      {!enabled ? (
        <p className="mt-6 rounded-control bg-warning-bg p-4 text-sm text-warning-fg">
          <strong>Analytics are off.</strong> Switch them on from the overview
          page by setting the analytics provider to <code>first-party</code>.
          Nothing is being recorded right now.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {events.map((event) => (
          <div
            key={event}
            className="rounded-surface border border-line bg-surface p-5"
          >
            <p className="font-display text-3xl font-extrabold">
              {summary.totals[event] ?? 0}
            </p>
            <p className="mt-1 text-sm font-bold text-muted">
              {eventLabels[event]}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-surface border border-line bg-surface p-5 md:p-6">
        <h2 className="text-xl font-bold">Recent events</h2>
        {summary.recent.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th scope="col" className="py-2 pr-4 font-bold">
                    Event
                  </th>
                  <th scope="col" className="py-2 pr-4 font-bold">
                    Path
                  </th>
                  <th scope="col" className="py-2 pr-4 font-bold">
                    Details
                  </th>
                  <th scope="col" className="py-2 font-bold">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.recent.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-4 font-bold">
                      {eventLabels[row.event] ?? row.event}
                    </td>
                    <td className="py-2 pr-4 text-muted">{row.path ?? "-"}</td>
                    <td className="py-2 pr-4 text-muted">
                      {Object.entries(row.props)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(", ") || "-"}
                    </td>
                    <td className="py-2 text-muted">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-muted">
            No events recorded in the last 30 days.
          </p>
        )}
      </section>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden>
          <div className="h-12 w-64 rounded bg-slate-100" />
          <div className="h-32 rounded-surface bg-slate-100" />
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
