import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/permissions";
import { getPublicEnv } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildEmailMessages } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/emails/send";

interface NotificationRow {
  id: string;
  to_email: string;
  template: string;
  payload: Record<string, unknown>;
  status: string;
  error: string | null;
}

function eventForTemplate(template: string) {
  if (template.startsWith("provider.applied")) return "provider.applied";
  if (template.startsWith("job.created")) return "job.created";
  if (template === "provider.approved") return "provider.approved";
  if (template === "provider.rejected") return "provider.rejected";
  if (template === "provider.more_info_requested") return "provider.more_info_requested";
  if (template === "offer.created") return "offer.created";
  if (template === "offer.accepted") return "offer.accepted";
  if (template === "offer.declined") return "offer.declined";
  if (template === "job.removed") return "job.removed";
  if (template === "waitlist.joined") return "waitlist.joined";
  if (template === "report.created") return "report.created";
  return null;
}

async function retry() {
  const admin = createAdminSupabase();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  const { siteUrl } = getPublicEnv();
  const { data, error } = await admin
    .from("notifications")
    .select("id, to_email, template, payload, status, error")
    .eq("status", "failed")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of (data ?? []) as NotificationRow[]) {
    const event = eventForTemplate(notification.template);
    if (!event) {
      skipped += 1;
      continue;
    }

    const messages = buildEmailMessages(event, notification.payload, siteUrl);
    const message = messages.find(
      (candidate) =>
        candidate.template === notification.template &&
        candidate.to === notification.to_email,
    );

    if (!message) {
      skipped += 1;
      continue;
    }

    const result = await sendEmail(message);

    if (result.ok) {
      sent += 1;
      await admin
        .from("notifications")
        .update({
          status: "sent",
          error: null,
          sent_at: new Date().toISOString(),
        })
        .eq("id", notification.id);
    } else {
      failed += 1;
      await admin
        .from("notifications")
        .update({ status: "failed", error: result.error })
        .eq("id", notification.id);
    }
  }

  return NextResponse.json({ sent, failed, skipped });
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;
  const isCron = Boolean(secret && cronSecret && secret === cronSecret);

  if (!isCron) {
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
