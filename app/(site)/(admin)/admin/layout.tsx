import { requireAdmin } from "@/lib/permissions";
import { DashNav } from "@/components/dash/dash-nav";
import { DashShell } from "@/components/shells/dash-shell";

// The admin check reads the session, so this route cannot be prerendered into
// a static shell. It blocks on the server instead, which keeps the 403 status
// for signed-in non-admins working.
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The check lives here, not in the page, so a signed-in non-admin gets a
  // real 403 status before any of the page streams.
  await requireAdmin();

  return (
    <DashShell variant="admin">
      <div className="dash-page">
        <div className="dash-page-top">
          <p className="dash-kicker">Administration</p>
          <DashNav />
        </div>
        <div className="dash-content">{children}</div>
      </div>
    </DashShell>
  );
}
