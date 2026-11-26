import { Suspense } from "react";
import { getServerEnv } from "@/lib/env";
import { getSessionContext } from "@/lib/permissions";
import { studioSans, studioSerif } from "@/lib/fonts";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { RosLogo } from "@/components/landing/ros-logo";

const inter = studioSans;
const serif = studioSerif;

async function Header({ hideAuthLinks }: { hideAuthLinks?: boolean }) {
  const context = await getSessionContext();

  return (
    <LandingHeader
      user={context.user}
      isProvider={Boolean(context.providerProfile)}
      hideAuthLinks={hideAuthLinks}
    />
  );
}

function HeaderFallback() {
  return (
    <header className="l-header">
      <div className="l-container l-header-row">
        <span className="l-brand">
          <RosLogo />
          Repairs &amp; Other Services
        </span>
        <span className="text-sm text-muted">Loading menu…</span>
      </div>
    </header>
  );
}

/**
 * Shell for the pages that use the landing design system: the public pages,
 * the auth pages and the post-a-job flow. The dashboards use DashShell
 * instead.
 */
export function StudioShell({
  children,
  hideAuthLinks,
}: {
  children: React.ReactNode;
  hideAuthLinks?: boolean;
}) {
  const env = getServerEnv();
  const supportEmail = env.supportEmail || env.adminEmail;

  return (
    <div className={`studio ${inter.variable} ${serif.variable}`}>
      <Suspense fallback={<HeaderFallback />}>
        <Header hideAuthLinks={hideAuthLinks} />
      </Suspense>

      <main id="main" className="l-main">
        {children}
      </main>

      <LandingFooter supportEmail={supportEmail} />
    </div>
  );
}
