import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const { resendApiKey, emailFrom } = getServerEnv();

  if (!resendApiKey) {
    return { ok: true as const, skipped: true as const };
  }

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: emailFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, skipped: false as const };
}
