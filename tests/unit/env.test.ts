import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicEnv, getServerEnv, isSupabaseConfigured } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("environment contract", () => {
  it("falls back to local defaults when public variables are absent", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(getPublicEnv()).toEqual({
      siteUrl: "http://localhost:3000",
      supabaseUrl: "",
      supabaseAnonKey: "",
    });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("reports Supabase configured only when both public values exist", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    expect(isSupabaseConfigured()).toBe(true);
  });

  it("provides safe server defaults", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "");

    expect(getServerEnv()).toEqual({
      serviceRoleKey: "",
      resendApiKey: "",
      emailFrom: "Repairs and Other Services <hello@example.com>",
      emailReplyTo: "",
      adminEmail: "",
    });
  });
});
