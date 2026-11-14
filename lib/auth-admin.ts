import { createAdminSupabase } from "@/lib/supabase/admin";
import type { AccountRole } from "@/lib/next-path";

export async function getUserEmail(userId: string) {
  const admin = createAdminSupabase();
  if (!admin) return null;

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}

/**
 * The role and provider state of an account, read with the server key.
 *
 * The request-scoped client cannot be used right after a sign in, because the
 * session cookie it writes is only visible on the next request. The landing
 * page is decided in that same request, so the role is read here instead.
 */
export async function getAccountState(userId: string) {
  const admin = createAdminSupabase();
  if (!admin) return { role: null as AccountRole, isProvider: false };

  const [{ data: profile }, { data: providerProfile }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", userId).maybeSingle(),
    admin
      .from("provider_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    role: (profile?.role as AccountRole) ?? null,
    isProvider: Boolean(providerProfile),
  };
}

export async function getUserEmails(userIds: string[]) {
  const unique = [...new Set(userIds)];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await getUserEmail(id)] as const),
  );

  return new Map(entries);
}
