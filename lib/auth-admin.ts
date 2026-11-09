import { createAdminSupabase } from "@/lib/supabase/admin";

export async function getUserEmail(userId: string) {
  const admin = createAdminSupabase();
  if (!admin) return null;

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}

export async function getUserEmails(userIds: string[]) {
  const unique = [...new Set(userIds)];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await getUserEmail(id)] as const),
  );

  return new Map(entries);
}
