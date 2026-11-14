import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Archive,
  ArrowUpRight,
  Briefcase,
  Flag,
  MessageSquare,
  UserCheck,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/permissions";
import { getAdminCounts, getAdminProviders, getAdminReports } from "@/lib/data/admin";
import { getSiteSettings } from "@/lib/data/settings";
import { updateSiteSetting } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/mend/status-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { DashAlert } from "@/components/dash/dash-alert";

export const metadata: Metadata = { title: "Admin overview" };

type SearchParams = Promise<{ ok?: string; error?: string }>;

const settingLabels: Record<string, string> = {
  pilot_notice: "Pilot notice",
  reapprove_on_key_change: "Re-approve when name or type changes",
  review_turnaround: "Review turnaround copy",
  provider_independence_notice: "Provider independence notice",
  support_email: "Support email",
  analytics_provider: "Analytics provider",
};

async function AdminContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireAdmin();

  const [counts, pending, reports, settings] = await Promise.all([
    getAdminCounts(),
    getAdminProviders("pending"),
    getAdminReports(),
    getSiteSettings(),
  ]);

  const openReports = reports.filter((report) => report.status === "open");

  const cards = [
    {
      label: "Pending providers",
      value: counts.pendingProviders,
      href: "/admin/providers?status=pending",
      Icon: UserCheck,
      tone: "amber",
    },
    {
      label: "Approved providers",
      value: counts.approvedProviders,
      href: "/admin/providers?status=approved",
      Icon: Users,
      tone: "green",
    },
    {
      label: "Open jobs",
      value: counts.openJobs,
      href: "/admin/jobs?status=open",
      Icon: Briefcase,
      tone: "blue",
    },
    {
      label: "Closed jobs",
      value: counts.closedJobs,
      href: "/admin/jobs?status=closed",
      Icon: Archive,
      tone: "neutral",
    },
    {
      label: "Offers",
      value: counts.offers,
      href: "/admin/offers",
      Icon: MessageSquare,
      tone: "orange",
    },
    {
      label: "Open reports",
      value: counts.openReports,
      href: "/admin/reports",
      Icon: Flag,
      tone: "purple",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Marketplace overview</h1>
          <p className="mt-2 max-w-[70ch] text-muted">
            Review providers, moderate content, manage the pilot area and change
            public copy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/api/admin/export/providers" variant="secondary">
            Export providers
          </ButtonLink>
          <ButtonLink href="/api/admin/export/jobs" variant="secondary">
            Export jobs
          </ButtonLink>
          <ButtonLink href="/api/admin/export/waitlist" variant="secondary">
            Export waitlist
          </ButtonLink>
        </div>
      </div>

      {params.ok ? <DashAlert tone="success">{params.ok}</DashAlert> : null}
      {params.error ? <DashAlert tone="danger">{params.error}</DashAlert> : null}

      <div className="dash-kpi-grid mt-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`dash-kpi dash-kpi-${card.tone}`}
          >
            <div className="dash-kpi-top">
              <span className="dash-kpi-label">{card.label}</span>
              <span className="dash-kpi-icon">
                <card.Icon aria-hidden />
              </span>
            </div>
            <p className="dash-kpi-value">{card.value}</p>
            <span className="dash-kpi-meta">
              View
              <ArrowUpRight className="size-3" aria-hidden />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-surface border border-line bg-surface p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2>Providers waiting for review</h2>
            <Link
              href="/admin/providers?status=pending"
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              See all
            </Link>
          </div>
          {pending.length > 0 ? (
            <ul className="mt-4 divide-y divide-line">
              {pending.slice(0, 5).map((provider) => (
                <li key={provider.user_id} className="py-3">
                  <Link
                    href={`/admin/providers/${provider.user_id}`}
                    className="font-bold text-primary underline underline-offset-4"
                  >
                    {provider.display_name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {provider.service_districts.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-muted">Nothing waiting. Good work.</p>
          )}
        </section>

        <section className="rounded-surface border border-line bg-surface p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2>Open reports</h2>
            <Link
              href="/admin/reports"
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              See all
            </Link>
          </div>
          {openReports.length > 0 ? (
            <ul className="mt-4 divide-y divide-line">
              {openReports.slice(0, 5).map((report) => (
                <li key={report.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge kind="report" status={report.status} />
                    <span className="text-sm font-bold capitalize">
                      {report.target_type}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {report.reason}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-muted">No open reports.</p>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-surface border border-line bg-surface p-5 md:p-6">
        <h2>Public copy and settings</h2>
        <p className="mt-1 text-sm text-muted">
          These values are stored in `site_settings` and used across the public
          site. Changes are logged.
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {Object.entries(settings).map(([key, value]) => (
            <form key={key} action={updateSiteSetting} className="space-y-2">
              <input type="hidden" name="key" value={key} />
              <label htmlFor={`setting-${key}`} className="block text-sm font-bold">
                {settingLabels[key] ?? key}
              </label>
              {key === "pilot_notice" ||
              key === "provider_independence_notice" ||
              key === "review_turnaround" ? (
                <textarea
                  id={`setting-${key}`}
                  name="value"
                  defaultValue={value}
                  rows={3}
                  className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : key === "reapprove_on_key_change" ? (
                <select
                  id={`setting-${key}`}
                  name="value"
                  defaultValue={value === "false" ? "false" : "true"}
                  className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="true">Yes, return to pending</option>
                  <option value="false">No, keep live</option>
                </select>
              ) : key === "analytics_provider" ? (
                <select
                  id={`setting-${key}`}
                  name="value"
                  defaultValue={value || "off"}
                  className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="off">Off</option>
                  <option value="first-party">First party, cookie free</option>
                </select>
              ) : (
                <Input
                  id={`setting-${key}`}
                  name="value"
                  defaultValue={value}
                  className="text-sm"
                />
              )}
              <Button type="submit" variant="secondary" className="min-h-10 px-3 text-sm">
                Save
              </Button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden>
          <div className="h-12 w-72 rounded bg-slate-100" />
          <div className="h-32 rounded-surface bg-slate-100" />
          <div className="h-64 rounded-surface bg-slate-100" />
        </div>
      }
    >
      <AdminContent searchParams={searchParams} />
    </Suspense>
  );
}
