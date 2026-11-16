import { isSupabaseConfigured } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type {
  NotificationPreference,
  NotificationRow,
} from "@/lib/types";

export type NotificationType =
  | "job.new"
  | "job.cancelled"
  | "job.completed"
  | "job.removed"
  | "offer.received"
  | "offer.accepted"
  | "offer.rejected"
  | "provider.approved"
  | "provider.rejected"
  | "provider.more_info_requested"
  | "provider.suspended"
  | "provider.reinstated"
  | "provider.removed";

export type EmailCategory = "job" | "offer";

export interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const defaultNotificationPreference: Omit<
  NotificationPreference,
  "user_id"
> = {
  email_enabled: true,
  job_updates: true,
  offer_updates: true,
};

/**
 * Writes in-app notifications with the service role. The caller is normally a
 * server action notifying a different user, so the request-scoped client's RLS
 * cannot be used here.
 *
 * A missing service key is not fatal: the action that triggered the
 * notification still succeeds, and the console says why nothing was written.
 */
export async function createNotifications(notifications: NewNotification[]) {
  const rows = notifications.filter((notification) => notification.userId);
  if (rows.length === 0) return;

  const admin = createAdminSupabase();
  if (!admin) {
    console.warn(
      "[notifications] SUPABASE_SECRET_KEY is not set; in-app notifications were not written.",
    );
    return;
  }

  const { error } = await admin.from("notifications").insert(
    rows.map((notification) => ({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data ?? {},
    })),
  );

  if (error) {
    console.error(
      `[notifications] could not write ${rows.length} notification(s): ${error.message}`,
    );
  }
}

export async function getUnreadNotificationCount(userId: string) {
  if (!isSupabaseConfigured()) return 0;

  const supabase = await createServerSupabase();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function getNotifications(userId: string, limit = 50) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as NotificationRow[];
}

export async function getNotificationPreferences(userId: string) {
  const fallback: NotificationPreference = {
    user_id: userId,
    ...defaultNotificationPreference,
  };

  if (!isSupabaseConfigured()) return fallback;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("user_id, email_enabled, job_updates, offer_updates")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return fallback;
  return data as NotificationPreference;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .is("read_at", null);

  return !error;
}

export async function markAllNotificationsRead(userId: string) {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  return !error;
}

export async function saveNotificationPreferences(
  userId: string,
  values: {
    emailEnabled: boolean;
    jobUpdates: boolean;
    offerUpdates: boolean;
  },
) {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      email_enabled: values.emailEnabled,
      job_updates: values.jobUpdates,
      offer_updates: values.offerUpdates,
    },
    { onConflict: "user_id" },
  );

  return !error;
}

/**
 * Pure preference gate so the rule is testable without a database.
 *
 * Account and moderation email is transactional and always sends. The two
 * optional categories follow the user's choices; a missing row means the
 * defaults (everything on).
 */
export function isEmailAllowed(
  preference:
    | Pick<
        NotificationPreference,
        "email_enabled" | "job_updates" | "offer_updates"
      >
    | null
    | undefined,
  category: EmailCategory,
) {
  if (!preference) return true;
  if (!preference.email_enabled) return false;
  if (category === "job") return preference.job_updates;
  return preference.offer_updates;
}

/**
 * Resolves the optional-email gate for a set of users in one query.
 * Unknown users default to allowed, which is the safe choice for a first
 * send; a user who wants to opt out will have a row. A failed preference
 * read fails closed so a transient database error cannot bypass an opt-out.
 */
export async function emailsAllowed(
  userIds: string[],
  category: EmailCategory,
) {
  const allowed = new Map<string, boolean>();
  for (const userId of userIds) allowed.set(userId, true);

  if (userIds.length === 0) return allowed;

  const admin = createAdminSupabase();
  if (!admin) {
    for (const userId of userIds) allowed.set(userId, false);
    return allowed;
  }

  const { data, error } = await admin
    .from("notification_preferences")
    .select("user_id, email_enabled, job_updates, offer_updates")
    .in("user_id", [...new Set(userIds)]);

  if (error) {
    console.error(
      `[notifications] could not read preferences: ${error.message}`,
    );
    for (const userId of userIds) allowed.set(userId, false);
    return allowed;
  }

  for (const preference of data ?? []) {
    allowed.set(preference.user_id, isEmailAllowed(preference, category));
  }

  return allowed;
}

/**
 * Where a notification should take the reader. Job activity goes to the job
 * page when the reader can still see it. A declined offer or a cancelled job
 * is no longer visible to that provider, so those go to the provider's own
 * list instead of a dead job page. Provider moderation goes to the provider
 * dashboard.
 */
export function notificationHref(notification: {
  type: string;
  data: Record<string, unknown>;
}) {
  if (notification.type === "offer.rejected") return "/provide/offers";
  if (notification.type === "job.cancelled") return "/provide/jobs";

  const jobId = notification.data.job_id;
  if (typeof jobId === "string" && jobId) return `/jobs/${jobId}`;
  if (notification.type.startsWith("provider.")) return "/provide";
  return "/account";
}
