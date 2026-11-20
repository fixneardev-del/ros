import { Resend } from "resend";
import { getEmailConfig, getServerEnv } from "@/lib/env";
import type { EmailMessage } from "@/lib/emails/templates";

const reportedReasons = new Set<string>();

function reportSkip(reason?: string) {
  if (!reason || reportedReasons.has(reason)) return;
  reportedReasons.add(reason);
  console.error(`[email] email disabled: ${reason}`);
}

/**
 * Resend accepts only letters, numbers, underscores and dashes in a tag
 * value. Template names use dots, so they are normalised first.
 */
function tagValue(template: string) {
  return template.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 256);
}

export async function sendEmail(
  input: EmailMessage & { idempotencyKey?: string },
) {
  const { resendApiKey, emailFrom, emailReplyTo } = getServerEnv();
  const config = getEmailConfig();

  if (!config.configured) {
    reportSkip(config.reason);
    return {
      ok: true as const,
      skipped: true as const,
      reason: config.reason,
    };
  }

  const resend = new Resend(resendApiKey);

  // The SDK returns errors instead of throwing them, but a network failure or
  // the timeout below can still reject, so both are handled.
  try {
    const { error } = await resend.emails.send(
      {
        from: emailFrom,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: emailReplyTo || undefined,
        tags: [{ name: "template", value: tagValue(input.template) }],
      },
      {
        idempotencyKey: input.idempotencyKey,
        // A hung API call must not hold the request open indefinitely.
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (error) {
      return { ok: false as const, error: error.message };
    }
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Email send failed.",
    };
  }

  return { ok: true as const, skipped: false as const };
}
