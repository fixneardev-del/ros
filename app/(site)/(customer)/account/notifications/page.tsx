import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Bell,
  Briefcase,
  Check,
  CheckCheck,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { requireUser } from "@/lib/permissions";
import {
  getNotificationPreferences,
  getNotifications,
  getUnreadNotificationCount,
  notificationHref,
} from "@/lib/notifications";
import type { NotificationRow } from "@/lib/types";
import { EmptyState } from "@/components/mend/tag";
import { NotificationPreferencesForm } from "@/components/forms/notification-forms";
import { markAllRead, markRead } from "@/lib/actions/notifications";

export const metadata: Metadata = { title: "Notifications" };

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(date);
}

function NotificationIcon({ type }: { type: string }) {
  if (type.startsWith("offer.")) return <MessageSquare aria-hidden />;
  if (type.startsWith("job.")) return <Briefcase aria-hidden />;
  if (type.startsWith("provider.")) return <ShieldCheck aria-hidden />;
  return <Bell aria-hidden />;
}

function NotificationItem({ notification }: { notification: NotificationRow }) {
  const unread = !notification.read_at;

  return (
    <li
      className={
        unread
          ? "rounded-surface border border-line bg-surface p-4 shadow-sm"
          : "rounded-surface border border-line bg-surface p-4"
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            unread
              ? "mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-info-bg text-info-fg [&_svg]:size-5"
              : "mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 [&_svg]:size-5"
          }
        >
          <NotificationIcon type={notification.type} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{notification.title}</p>
            {unread ? (
              <span className="rounded-full bg-[var(--d-orange-tint)] px-2 py-0.5 text-xs font-bold text-[var(--d-orange-brand)]">
                New
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">{notification.body}</p>
          <p className="mt-2 text-xs text-muted">
            {formatNotificationTime(notification.created_at)}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href={notificationHref(notification)}
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              Open
            </Link>
            {unread ? (
              <form action={markRead}>
                <input type="hidden" name="id" value={notification.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 text-sm font-bold text-muted underline underline-offset-4 hover:text-primary"
                >
                  <Check className="size-4" aria-hidden />
                  Mark as read
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

async function NotificationsContent() {
  const context = await requireUser("/account/notifications");
  const [notifications, preferences, unread] = await Promise.all([
    getNotifications(context.user.id),
    getNotificationPreferences(context.user.id),
    getUnreadNotificationCount(context.user.id),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/account"
            className="text-sm font-bold text-muted underline underline-offset-4"
          >
            Back to account
          </Link>
          <h1 className="mt-2">Notifications</h1>
          <p className="mt-2 text-muted">
            Offers, job updates and account decisions stay here.{" "}
            {unread > 0
              ? `${unread} unread notification${unread === 1 ? "" : "s"}.`
              : "You are all caught up."}
          </p>
        </div>

        {unread > 0 ? (
          <form action={markAllRead}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-control border border-line bg-surface px-4 py-2 text-sm font-bold text-primary hover:bg-info-bg"
            >
              <CheckCheck className="size-4" aria-hidden />
              Mark all as read
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="notification-list-heading">
          <h2 id="notification-list-heading" className="sr-only">
            Your notifications
          </h2>

          {notifications.length === 0 ? (
            <EmptyState
              title="No notifications yet"
              description="When a provider sends an offer, or a job changes, you will see it here."
            />
          ) : (
            <ul className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-surface border border-line bg-surface p-5 md:p-6">
            <h2>Email settings</h2>
            <p className="mt-1 text-sm text-muted">
              Choose which optional emails you receive. Account, security and
              moderation email is always sent.
            </p>
            <div className="mt-5">
              <NotificationPreferencesForm preferences={preferences} />
            </div>
          </section>

          <div className="rounded-surface border border-line bg-surface p-5 text-sm">
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="size-4 text-success-fg" aria-hidden />
              In-app notifications are always on
            </p>
            <p className="mt-1 text-muted">
              The bell in the header shows unread items. Open a notification to
              see the job or account page it refers to.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div className="dash-page">
      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]" aria-hidden>
            <div className="space-y-3">
              <div className="h-10 w-48 rounded-surface bg-slate-100" />
              <div className="h-24 rounded-surface bg-slate-100" />
              <div className="h-24 rounded-surface bg-slate-100" />
            </div>
            <div className="h-64 rounded-surface bg-slate-100" />
          </div>
        }
      >
        <NotificationsContent />
      </Suspense>
    </div>
  );
}
