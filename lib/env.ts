export function getPublicEnv() {
  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

export function getServerEnv() {
  return {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
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
