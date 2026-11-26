import { Suspense } from "react";
import {
  canSwitchDashboard,
  dashboardRole,
  getSessionContext,
} from "@/lib/permissions";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { studioSans } from "@/lib/fonts";
import { DashHeader } from "@/components/dash/dash-header";
import { DashFooter } from "@/components/dash/dash-footer";
import "@/app/dash.css";

/**
 * The chrome follows the account's one dashboard, not the URL that happens to
 * be open. Reading the role here, inside Suspense, keeps shared pages such as
 * /account and a job detail page from showing another dashboard's navigation.
 */
async function Header() {
  const context = await getSessionContext();
  const unreadCount = context.user
    ? await getUnreadNotificationCount(context.user.id)
    : 0;

  return (
    <DashHeader
      user={context.user}
      name={context.profile?.full_name}
      unreadCount={unreadCount}
      variant={dashboardRole(context)}
      canSwitch={canSwitchDashboard(context)}
    />
  );
}

async function Footer() {
  const context = await getSessionContext();
  return <DashFooter variant={dashboardRole(context)} />;
}

function HeaderFallback() {
  return (
    <header className="dash-header">
      <span className="dash-brand">
        Repairs{" "}
        <span className="dash-brand-accent" aria-hidden>
          &amp;
        </span>{" "}
        Other Services
      </span>
      <span className="dash-loading">Loading dashboard…</span>
    </header>
  );
}

/**
 * Shell for the customer, provider and admin dashboards. It uses the Movexa
 * dashboard design system scoped under `.dash`.
 */
export function DashShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`dash ${studioSans.variable}`}>
      <div className="dash-shell">
        <div className="dash-inner">
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>

          <main id="main" className="dash-main">
            {children}
          </main>

          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
