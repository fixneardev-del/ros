import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/permissions";
import { getPublicEnv } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildEmailMessages } from "@/lib/emails/templates";
import {
  emailCategoryForTemplate,
  eventForTemplate,
  matchesOutboxRow,
} from "@/lib/emails/events";
import { isEmailAllowed } from "@/lib/notifications";
import { sendEmail } from "@/lib/emails/send";
import { isCronRequest } from "@/lib/cron-auth";

export const maxDuration = 60;

const MAX_RETRIES_PER_RUN = 5;

interface DeliveryRow {
  id: string;
  user_id: string | null;
  to_email: string;
  template: string;
  payload: Record<string, unknown>;
  status: string;
  error: string | null;
  attempt_count: number;
}

const MAX_DELIVERY_ATTEMPTS = 5;
const STALE_QUEUED_AFTER_MS = 10 * 60 * 1000;

async function retry() {
  const admin = createAdminSupabase();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  const { siteUrl } = getPublicEnv();
  const staleQueuedBefore = new Date(
    Date.now() - STALE_QUEUED_AFTER_MS,
  ).toISOString();
  const { data, error } = await admin
    .from("notification_deliveries")
    .select(
      "id, user_id, to_email, template, payload, status, error, attempt_count",
    )
    .in("status", ["queued", "failed"])
    .or(`status.eq.failed,created_at.lt.${staleQueuedBefore}`)
    .order("updated_at", { ascending: true })
    .limit(MAX_RETRIES_PER_RUN);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of (data ?? []) as DeliveryRow[]) {
    if (notification.attempt_count >= MAX_DELIVERY_ATTEMPTS) {
      skipped += 1;
      await admin
        .from("notification_deliveries")
        .update({
          status: "skipped",
          error: "The delivery retry limit was reached.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", notification.id);
      continue;
    }

    const category = emailCategoryForTemplate(notification.template);
    if (category && notification.user_id) {
      const { data: preference, error: preferenceError } = await admin
        .from("notification_preferences")
        .select("email_enabled, job_updates, offer_updates")
        .eq("user_id", notification.user_id)
        .maybeSingle();

      if (preferenceError) {
        console.error(
          `[notifications] could not read preferences for ${notification.user_id}: ${preferenceError.message}`,
        );
        skipped += 1;
        await admin
          .from("notification_deliveries")
          .update({
            status: "skipped",
            error: "Notification preferences could not be verified.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", notification.id);
        continue;
      }

      if (preference && !isEmailAllowed(preference, category)) {
        skipped += 1;
        await admin
          .from("notification_deliveries")
          .update({
            status: "skipped",
            error: "Suppressed by notification preferences.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", notification.id);
        continue;
      }
    }

    const event = eventForTemplate(notification.template);
    if (!event) {
      skipped += 1;
      await admin
        .from("notification_deliveries")
        .update({
          status: "skipped",
          error: "This template cannot be rebuilt for a retry.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", notification.id);
      continue;
    }

    const messages = buildEmailMessages(event, notification.payload, siteUrl);
    const message = messages.find((candidate) =>
      matchesOutboxRow(candidate, notification),
    );

    if (!message) {
      skipped += 1;
      await admin
        .from("notification_deliveries")
        .update({
          status: "skipped",
          error: "The original email message could not be rebuilt.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", notification.id);
      continue;
    }

    const result = await sendEmail({
      ...message,
      idempotencyKey: `notification/${notification.id}`,
    });

    if (!result.ok) {
      failed += 1;
      await admin
        .from("notification_deliveries")
        .update({
          status: "failed",
          error: result.error,
          attempt_count: notification.attempt_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", notification.id);
    } else if (result.skipped) {
      // No provider key. Leave the row failed so a later run can send it once
      // email is configured.
      skipped += 1;
      await admin
        .from("notification_deliveries")
        .update({
          status: "failed",
          error: result.reason ?? "Email is not configured.",
          attempt_count: notification.attempt_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", notification.id);
    } else {
      sent += 1;
      await admin
        .from("notification_deliveries")
        .update({
          status: "sent",
          error: null,
          sent_at: new Date().toISOString(),
          attempt_count: notification.attempt_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", notification.id);
    }
  }

  return NextResponse.json({ sent, failed, skipped });
}

export async function POST(request: Request) {
  if (!isCronRequest(request)) {
    const context = await getSessionContext();
    if (!context.user || context.profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return retry();
}

export async function GET(request: Request) {
  return POST(request);
}
