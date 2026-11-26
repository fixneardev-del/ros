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

/**
 * Reads the saved dashboard without making an older database fatal.
 *
 * While the hosted `active_dashboard` migration is still pending, Supabase
 * answers this query with 42703 and no row. Treating that as "customer" keeps
 * sign-in and admin access working; applying the migration later enables
 * switching without another deploy.
 */
export async function readActiveDashboard(
  client: ActiveDashboardClient,
  userId: string,
): Promise<ActiveDashboard> {
  const query = client.from("profiles") as ProfileQuery;
  const { data, error } = await query
    .select("active_dashboard")
    .eq("id", userId)
    .maybeSingle();

  if (error || data?.active_dashboard !== "provider") return "customer";
  return "provider";
}
