import { StudioShell } from "@/components/shells/studio-shell";
import "@/app/design-system.css";
import "@/app/studio.css";

/**
 * Job pages: posting a job, the job detail page and the provider application.
 * These are working pages rather than dashboards, so they use the studio
 * design system.
 */
export default function JobPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudioShell>{children}</StudioShell>;
}
