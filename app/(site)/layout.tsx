import { Suspense } from "react";
import { AnalyticsPageViews } from "@/components/mend/analytics";

/**
 * Each route group owns its own chrome. The studio group uses the landing
 * design system, and the customer, provider and admin groups use the
 * dashboard design system. This keeps the two design systems apart.
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
