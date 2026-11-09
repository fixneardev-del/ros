"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { studioSans, studioSerif } from "@/lib/fonts";
import "@/app/design-system.css";
import "@/app/studio.css";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={`studio ${studioSans.variable} ${studioSerif.variable}`}>
      <main id="main" className="l-container s-page s-page-narrow">
        <p className="l-kicker">Something went wrong</p>
        <h1 className="mt-3">We couldn&apos;t load this page.</h1>
        <p className="l-lead mt-4">
          Try again. If it keeps happening, come back in a few minutes or
          contact us using the address in the footer.
        </p>
        <div className="mt-8">
          <Button onClick={reset}>Try again</Button>
        </div>
      </main>
    </div>
  );
}
