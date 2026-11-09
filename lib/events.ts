import { after } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { buildEmailMessages } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/emails/send";
import { createAdminSupabase } from "@/lib/supabase/admin";

export type DomainEvent =
  | "provider.applied"
  | "provider.approved"
  | "provider.rejected"
  | "provider.more_info_requested"
  | "provider.removed"
  | "job.created"
  | "offer.created"
  | "offer.accepted"
  | "offer.declined"
  | "job.removed"
  | "waitlist.joined"
  | "report.created";

/**
 * Writes the outbox rows, then sends in the background. A failed email never
 * fails the action that triggered it.
 */
export async function emit(
  event: DomainEvent,
  payload: Record<string, unknown>,
) {
  const { siteUrl } = getPublicEnv();
  const messages = buildEmailMessages(event, payload, siteUrl);

  if (messages.length === 0) return;

  const admin = createAdminSupabase();
  const queued: Array<{ id: string | null; message: (typeof messages)[number] }> = [];

  if (admin) {
    for (const message of messages) {
      const { data, error } = await admin
        .from("notifications")
        .insert({
          to_email: message.to,
          template: message.template,
          payload,
          status: "queued",
        })
        .select("id")
        .single();

      queued.push({ id: error ? null : (data?.id as string), message });
    }
  } else {
    for (const message of messages) queued.push({ id: null, message });
  }

  const task = async () => {
    for (const item of queued) {
      const result = await sendEmail(item.message);

      if (admin && item.id) {
        await admin
          .from("notifications")
          .update({
            status: result.ok ? "sent" : "failed",
            error: result.ok ? null : result.error,
            sent_at: result.ok ? new Date().toISOString() : null,
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
