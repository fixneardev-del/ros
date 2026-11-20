export function getPublicEnv() {
  // Supabase has renamed the public API key. The publishable key is the
  // current name; the anon key is still accepted so older projects and the
  // local stack keep working.
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: supabaseKey,
  };
}

export function getServerEnv() {
  // The secret key is the current name for the server-only key. The service
  // role key is still accepted.
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return {
    serviceRoleKey: secretKey,
    resendApiKey: process.env.RESEND_API_KEY || "",
    emailFrom:
      process.env.EMAIL_FROM || "Repairs and Other Services <hello@example.com>",
    emailReplyTo: process.env.EMAIL_REPLY_TO || "",
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "",
  };
}

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export interface EmailConfigResult {
  configured: boolean;
  reason?: string;
}

const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailAddressFrom(value: string) {
  const bracketed = value.match(/<([^<>]+)>/);
  const candidate = (bracketed ? bracketed[1] : value).trim();
  return EMAIL_ADDRESS.test(candidate) ? candidate.toLowerCase() : null;
}

/**
 * Checks enough of the email config to avoid pretending a placeholder setup
 * can send. The check is deliberately conservative: it does not call Resend
 * and it never throws at import time, so local builds remain unaffected.
 */
export function getEmailConfig(): EmailConfigResult {
  const { resendApiKey, emailFrom } = getServerEnv();

  if (!resendApiKey) {
    return { configured: false, reason: "RESEND_API_KEY is empty." };
  }

  if (!/^re_[A-Za-z0-9_-]{16,}$/.test(resendApiKey)) {
    return {
      configured: false,
      reason: "RESEND_API_KEY is not a valid Resend key.",
    };
  }

  const address = emailAddressFrom(emailFrom);
  if (!address) {
    return {
      configured: false,
      reason: "EMAIL_FROM does not contain a valid email address.",
    };
  }

  const domain = address.split("@")[1];
  if (
    domain === "example.com" ||
    domain.endsWith(".example.com") ||
    domain === "localhost" ||
    domain.endsWith(".localhost")
  ) {
    return {
      configured: false,
      reason: "EMAIL_FROM uses a placeholder domain.",
    };
  }

  return { configured: true };
}

export function isEmailConfigured() {
  return getEmailConfig().configured;
}
