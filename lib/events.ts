import { after } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { buildEmailMessages } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/emails/send";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  emailsAllowed,
  type EmailCategory,
} from "@/lib/notifications";

export type DomainEvent =
  | "auth.welcome"
  | "auth.signed_in"
  | "provider.applied"
  | "provider.approved"
  | "provider.rejected"
  | "provider.more_info_requested"
  | "provider.suspended"
  | "provider.reinstated"
  | "provider.removed"
  | "job.created"
  | "job.cancelled"
  | "job.completed"
  | "offer.created"
  | "offer.accepted"
  | "offer.declined"
  | "job.removed"
  | "waitlist.joined"
  | "report.created";

export interface EmitOptions {
  /** Only optional categories are gated by notification_preferences. */
  emailCategory?: EmailCategory;
  /** Maps the message recipient email to the user whose preferences apply. */
  recipients?: Record<string, string | null | undefined>;
}

/**
 * Writes the outbox rows, then sends in the background. A failed email never
 * fails the action that triggered it.
 *
 * Event email that the notification specification marks as "Yes" (a new
 * offer, an accepted offer, a cancelled job, a moderation decision) is always
 * sent. Optional "may send" email (a declined offer, a completed job) is
 * filtered by the recipient's notification preferences before it reaches the
 * outbox.
 */
export async function emit(
  event: DomainEvent,
  payload: Record<string, unknown>,
  options: EmitOptions = {},
) {
  const { siteUrl } = getPublicEnv();
  let messages = buildEmailMessages(event, payload, siteUrl);

  if (messages.length === 0) return;

  const admin = createAdminSupabase();

  if (admin && options.emailCategory) {
    const recipients = options.recipients ?? {};
    const userIds = [
      ...new Set(
        Object.values(recipients).filter(
          (userId): userId is string => Boolean(userId),
        ),
      ),
    ];

    if (userIds.length > 0) {
      const allowed = await emailsAllowed(userIds, options.emailCategory);
      messages = messages.filter((message) => {
        const userId = recipients[message.to];
        if (!userId) return true;
        return allowed.get(userId) ?? true;
      });
    }
  }

  if (messages.length === 0) return;

  const queued: Array<{
    id: string;
    message: (typeof messages)[number];
    idempotencyKey: string;
  }> = [];

  if (!admin) {
    console.error(
      "[email] SUPABASE_SECRET_KEY is not set; no email messages were sent.",
    );
    return;
  }

  for (const message of messages) {
    const userId = options.recipients?.[message.to] ?? null;
    const { data, error } = await admin
      .from("notification_deliveries")
      .insert({
        user_id: userId,
        to_email: message.to,
        template: message.template,
        payload,
        channel: "email",
        status: "queued",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error(
        `[email] could not queue ${message.template} for ${message.to}: ${error?.message ?? "unknown error"}`,
      );
      continue;
    }

    queued.push({
      id: data.id,
      message,
      // The outbox row is the natural identity of this send, so a retry
      // returns the original Resend response instead of a second email.
      idempotencyKey: `notification/${data.id}`,
    });
  }

  const task = async () => {
    for (const item of queued) {
      const result = await sendEmail({
        ...item.message,
        idempotencyKey: item.idempotencyKey,
      });

      if (!result.ok) {
        console.error(
          `[email] ${item.message.template} to ${item.message.to} failed: ${result.error}`,
        );
      }

      if (admin && item.id) {
        if (result.ok && result.skipped) {
          // No provider key: keep the row retryable instead of claiming the
          // email was delivered.
          await admin
            .from("notification_deliveries")
            .update({
              status: "failed",
              error:
                "Email is not configured (RESEND_API_KEY is empty).",
              attempt_count: 1,
              sent_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);
          continue;
        }

        await admin
          .from("notification_deliveries")
          .update({
            status: result.ok ? "sent" : "failed",
            error: result.ok ? null : result.error,
            attempt_count: 1,
            sent_at: result.ok ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }
    }
  };

  try {
    after(task);
  } catch {
    void task();
  }
}
