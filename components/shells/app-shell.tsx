import { Suspense } from "react";
import { SiteFooter } from "@/components/mend/site-footer";
import { SiteHeader } from "@/components/mend/site-header";
import { getSessionContext } from "@/lib/permissions";

async function Header() {
  const context = await getSessionContext();

  return (
    <SiteHeader
      user={context.user}
      isAdmin={context.profile?.role === "admin"}
      isProvider={Boolean(context.providerProfile)}
    />
  );
}

function HeaderFallback() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-4 px-4 py-2 md:px-8 lg:px-12">
        <span className="font-display text-lg font-extrabold tracking-tight md:text-xl">
          Repairs <span className="text-primary">&amp;</span> Other Services
        </span>
        <span className="text-sm text-muted">Loading menu…</span>
      </div>
    </header>
  );
}

/**
 * Shell for the signed in dashboards and the admin area. These screens keep
 * the original application design tokens and layout.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
