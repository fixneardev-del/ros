import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="l-container">
      <div className="s-page s-page-narrow">
        <p className="l-kicker">Legal</p>
        <h1 className="mt-3">{title}</h1>
        <p className="l-legal-updated">Last updated {updated}</p>

        <div className="l-notice">
          <strong>Pilot copy.</strong> This page is a working draft for the
          Glasgow pilot. The approved legal text will replace it before public
          launch.
        </div>

        <div className="prose-mend l-prose">{children}</div>
      </div>
    </div>
  );
}
