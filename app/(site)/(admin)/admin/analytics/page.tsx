import { Suspense } from "react";
import type { Metadata } from "next";
import { Briefcase, Eye, Search, UserPlus } from "lucide-react";
import { requireAdmin } from "@/lib/permissions";
import { getAnalyticsSummary } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { isAnalyticsEnabled } from "@/lib/analytics-server";
import { DashAlert } from "@/components/dash/dash-alert";

export const metadata: Metadata = { title: "Admin analytics" };

const eventConfig = {
  page_view: {
    label: "Page views",
    short: "Views",
    tone: "blue",
    Icon: Eye,
  },
  search: {
    label: "Searches",
    short: "Searches",
    tone: "purple",
    Icon: Search,
  },
  job_posted: {
    label: "Jobs posted",
    short: "Jobs",
    tone: "orange",
    Icon: Briefcase,
  },
  provider_applied: {
    label: "Provider applications",
    short: "Applications",
    tone: "green",
    Icon: UserPlus,
  },
} as const;

const events = Object.keys(eventConfig) as Array<keyof typeof eventConfig>;

async function AnalyticsContent() {
  await requireAdmin();
  const [summary, enabled] = await Promise.all([
    getAnalyticsSummary(30),
    isAnalyticsEnabled(),
  ]);

  const max = Math.max(0, ...events.map((event) => summary.totals[event] ?? 0));
  const topEvent = events.reduce(
    (best, event) =>
      (summary.totals[event] ?? 0) > (summary.totals[best] ?? 0) ? event : best,
    events[0],
  );
  const topCount = summary.totals[topEvent] ?? 0;

  return (
    <div>
      <div>
        <h1>Analytics</h1>
        <p className="mt-2 max-w-[70ch] text-muted">
          First party, cookie free events from the last 30 days. No IP address,
          no user id and no third party script are stored.
        </p>
      </div>

      {!enabled ? (
        <div className="mt-6">
          <DashAlert tone="warning">
            <strong>Analytics are off.</strong> Switch them on from the
            overview page by setting the analytics provider to{" "}
            <code>first-party</code>. Nothing is being recorded right now.
          </DashAlert>
        </div>
      ) : null}

      <div className="dash-kpi-grid dash-kpi-grid-4 mt-8">
        {events.map((event) => {
          const config = eventConfig[event];
          return (
            <div
              key={event}
              className={`dash-kpi dash-kpi-${config.tone}`}
            >
              <div className="dash-kpi-top">
                <span className="dash-kpi-label">{config.label}</span>
                <span className="dash-kpi-icon">
                  <config.Icon aria-hidden />
                </span>
              </div>
              <p className="dash-kpi-value">{summary.totals[event] ?? 0}</p>
              <span className="dash-kpi-meta">Last 30 days</span>
            </div>
          );
        })}
      </div>

      <div className="dash-analytics-grid mt-8">
        <section className="dash-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2>Event mix</h2>
              <p className="mt-1 text-sm text-muted">
                How recorded events are distributed over the last 30 days.
              </p>
            </div>
            <span className="dash-chip">{summary.total} total</span>
          </div>

          {summary.total > 0 ? (
            <div className="dash-bars">
              {events.map((event) => {
                const config = eventConfig[event];
                const value = summary.totals[event] ?? 0;
                const width = max > 0 ? Math.round((value / max) * 100) : 0;
                return (
                  <div key={event} className="dash-bar-row">
                    <span className="dash-bar-label">
                      <span
                        className={`dash-dot dash-dot-${config.tone}`}
                        aria-hidden
                      />
                      {config.short}
                    </span>
                    <span className="dash-bar-track" aria-hidden>
                      <span
                        className={`dash-bar-fill dash-bar-${config.tone}`}
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <span className="dash-bar-value">{value}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 text-muted">No events recorded in this window.</p>
          )}
        </section>

        <section className="dash-card">
          <h2>At a glance</h2>
          <div className="dash-stat-stack">
            <div className="dash-stat">
              <span>Total events</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="dash-stat">
              <span>Top event</span>
              <strong>{topCount > 0 ? eventConfig[topEvent].label : "None yet"}</strong>
            </div>
            <div className="dash-stat">
              <span>Top event count</span>
              <strong>{topCount}</strong>
            </div>
            <div className="dash-stat">
              <span>Window</span>
              <strong>30 days</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="dash-card mt-8">
        <h2>Recent events</h2>
        {summary.recent.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Path</th>
                  <th scope="col">Details</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent.map((row) => (
                  <tr key={row.id}>
                    <td className="font-bold">
                      {eventConfig[row.event as keyof typeof eventConfig]
                        ?.label ?? row.event}
                    </td>
                    <td className="text-muted">{row.path ?? "-"}</td>
                    <td className="text-muted">
                      {Object.entries(row.props)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(", ") || "-"}
                    </td>
                    <td className="text-muted">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-muted">
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
