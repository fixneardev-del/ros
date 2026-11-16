import { Suspense } from "react";
import { getSessionContext } from "@/lib/permissions";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { studioSans } from "@/lib/fonts";
import { DashHeader } from "@/components/dash/dash-header";
import { DashFooter } from "@/components/dash/dash-footer";
import "@/app/dash.css";

type DashVariant = "customer" | "provider" | "admin";

async function Header({ variant }: { variant: DashVariant }) {
  const context = await getSessionContext();
  const unreadCount = context.user
    ? await getUnreadNotificationCount(context.user.id)
    : 0;

  return (
    <DashHeader
      user={context.user}
      name={context.profile?.full_name}
      isProvider={Boolean(context.providerProfile)}
      isAdmin={context.profile?.role === "admin"}
      providerStatus={context.providerProfile?.status ?? null}
      unreadCount={unreadCount}
      variant={variant}
    />
  );
}

function HeaderFallback({ variant }: { variant: DashVariant }) {
  return (
    <header className="dash-header">
      <span className="dash-brand">
        Repairs{" "}
        <span className="dash-brand-accent" aria-hidden>
          &amp;
        </span>{" "}
        Other Services
        {variant === "admin" ? (
          <span className="dash-brand-chip">Admin</span>
        ) : null}
      </span>
      <span className="dash-loading">Loading dashboard…</span>
    </header>
  );
}

/**
 * Shell for the customer, provider and admin dashboards. It uses the Movexa
 * dashboard design system scoped under `.dash`.
 */
export function DashShell({
  children,
  variant = "customer",
}: {
  children: React.ReactNode;
  variant?: DashVariant;
}) {
  return (
    <div className={`dash ${studioSans.variable}`}>
      <div className="dash-shell">
        <div className="dash-inner">
          <Suspense fallback={<HeaderFallback variant={variant} />}>
            <Header variant={variant} />
          </Suspense>

          <main id="main" className="dash-main">
            {children}
          </main>

          <DashFooter variant={variant} />
        </div>
      </div>
    </div>
  );
}
