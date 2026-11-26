"use server";

import { emit } from "@/lib/events";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/schemas/contact";

export async function sendContactMessage(
  _previous: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Bots fill every field. Respond as if the message was sent, without queueing
  // an email or telling the bot why it was ignored.
  const company = formData.get("company");
  if (typeof company === "string" && company.trim()) return { ok: true };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check your message.",
    };
  }

  const { name, email, subject, message } = parsed.data;
  const limit = checkRateLimit(
    `contact:${email.toLowerCase()}`,
    3,
    60 * 60 * 1000,
  );
  if (!limit.allowed) {
    return { ok: false, error: "You have already sent a few messages. We will reply soon." };
  }

  await emit("contact.submitted", {
    adminEmail: getServerEnv().adminEmail,
    senderName: name,
    senderEmail: email,
    subject,
    message,
  });

  return { ok: true };
}
