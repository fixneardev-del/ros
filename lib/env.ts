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
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "",
  };
}

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  return Boolean(supabaseUrl && supabaseAnonKey);
}
