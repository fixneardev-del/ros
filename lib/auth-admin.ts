import { createClient } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { readDashboardCookieForUser } from "@/lib/dashboard-cookie";
import { readActiveDashboard } from "@/lib/supabase/active-dashboard";
import { getPublicEnv } from "@/lib/env";
import type { AccountRole, ActiveDashboard } from "@/lib/next-path";

export async function getUserEmail(userId: string) {
  const admin = createAdminSupabase();
  if (!admin) return null;

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}

type AccountState = {
  role: AccountRole;
  isProvider: boolean;
  activeDashboard: ActiveDashboard;
};

const emptyState: AccountState = {
  role: null,
  isProvider: false,
  activeDashboard: "customer",
};

/**
 * A client scoped to the user's freshly issued access token.
 *
 * The session cookie written by a sign-in is not visible to the same request,
 * so the landing page cannot use the normal server client here. RLS already
 * allows a signed-in user to read their own role and provider profile, which
 * makes the token a better source than an elevated server key.
 */
function createTokenClient(accessToken: string) {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function readAccountState(
  client: ReturnType<typeof createAdminSupabase> | ReturnType<typeof createTokenClient>,
  userId: string,
  savedFromCookie: AccountState["activeDashboard"] | null,
): Promise<AccountState | null> {
  if (!client) return null;

  // `role` is always present, even before the dashboard migration is applied.
  // Reading it separately keeps an admin from being downgraded to a customer
  // just because the newer `active_dashboard` column is not live yet.
  const [{ data: profile }, { data: providerProfile }] = await Promise.all([
    client.from("profiles").select("role").eq("id", userId).maybeSingle(),
    client
      .from("provider_profiles")
      .select("user_id, status")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!profile && !providerProfile) return null;

  const activeDashboard =
    profile?.role === "admin"
      ? "customer"
      : await readActiveDashboard(client, userId, savedFromCookie);

  return {
    role: (profile?.role as AccountRole) ?? null,
    // Pending applicants are not providers yet. Only an approved profile can
    // use the provider dashboard.
    isProvider: providerProfile?.status === "approved",
    activeDashboard,
  };
}

/**
 * The role and provider state of an account.
 *
 * Pass the access token from the sign-in response when one is available. That
 * read works without a service-role key and sees the same data the user will
 * see on the next request. The elevated client remains as a fallback for
 * callers that have no token.
 */
export async function getAccountState(
  userId: string,
  accessToken?: string | null,
): Promise<AccountState> {
  const savedFromCookie = await readDashboardCookieForUser(userId);

  if (accessToken) {
    try {
      const state = await readAccountState(
        createTokenClient(accessToken),
        userId,
        savedFromCookie,
      );
      if (state) return state;
    } catch (error) {
      console.error(
        `[auth] token-scoped role lookup failed for ${userId}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  const admin = createAdminSupabase();
  if (!admin) return emptyState;

  try {
    return (await readAccountState(admin, userId, savedFromCookie)) ?? emptyState;
  } catch (error) {
    // The session has already been established at this point. A role lookup
    // failure must not turn a successful sign-in into an authentication error.
    console.error(
      `[auth] could not resolve role for ${userId}: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return emptyState;
  }
}

export async function getUserEmails(userIds: string[]) {
  const unique = [...new Set(userIds)];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await getUserEmail(id)] as const),
  );

  return new Map(entries);
}
