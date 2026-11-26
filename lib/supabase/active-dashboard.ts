import type { ActiveDashboard } from "@/lib/next-path";

type MaybeSingleResult = {
  data: { active_dashboard?: string | null } | null;
  error: unknown;
};

// Kept deliberately shallow: the full Supabase query-builder type makes the
// proxy's type instantiation explode when it is used as a structural argument.
type ActiveDashboardClient = {
  from: (table: string) => unknown;
};

type ProfileQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => PromiseLike<MaybeSingleResult>;
    };
  };
};

export const ACTIVE_DASHBOARD_COOKIE = "ros-dashboard";

/** The cookie is scoped to a user so a previous account's choice cannot carry over. */
export function dashboardCookieValue(
  userId: string,
  dashboard: ActiveDashboard,
) {
  return `${userId}:${dashboard}`;
}

export function readDashboardCookie(
  value: string | undefined,
  userId: string,
): ActiveDashboard | null {
  if (!value) return null;
  const [owner, dashboard] = value.split(":");
  if (owner !== userId) return null;
  return dashboard === "customer" || dashboard === "provider" ? dashboard : null;
}

/**
 * Reads the saved dashboard without making an older database fatal.
 *
 * While the hosted `active_dashboard` migration is still pending, Supabase
 * answers this query with 42703 and no row. An approved provider then opens the
 * provider dashboard, matching the migration's backfill; only an explicit
 * "customer" value keeps them on the customer dashboard. A switch made before
 * the migration exists is stored in a user-scoped cookie and takes priority.
 * Callers that are not approved providers never reach a provider route, so
 * admins and applicants are unaffected.
 */
export async function readActiveDashboard(
  client: ActiveDashboardClient,
  userId: string,
  savedFromCookie: ActiveDashboard | null = null,
): Promise<ActiveDashboard> {
  if (savedFromCookie) return savedFromCookie;

  const query = client.from("profiles") as ProfileQuery;
  const { data, error } = await query
    .select("active_dashboard")
    .eq("id", userId)
    .maybeSingle();

  if (!error && data?.active_dashboard === "customer") return "customer";
  return "provider";
}
