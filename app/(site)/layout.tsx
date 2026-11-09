import { Suspense } from "react";
import { AnalyticsPageViews } from "@/components/mend/analytics";

/**
 * Each route group owns its own chrome: the studio groups use StudioShell and
 * the dashboards use AppShell. This keeps the two design systems apart.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsPageViews />
      </Suspense>
      {children}
    </>
  );
}
