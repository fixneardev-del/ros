import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailConfig, isEmailConfigured } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("email configuration", () => {
  it("accepts a real Resend key and verified-style sender", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key_abcdefghijklmnop");
    vi.stubEnv("EMAIL_FROM", "Repairs and Other Services <hello@repairs.example.co.uk>");

    expect(getEmailConfig()).toEqual({ configured: true });
    expect(isEmailConfigured()).toBe(true);
  });

  it("rejects an empty key", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "Repairs and Other Services <hello@repairs.example.co.uk>");

    expect(getEmailConfig()).toEqual({
      configured: false,
      reason: "RESEND_API_KEY is empty.",
    });
  });

  it("rejects placeholder sender domains", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key_abcdefghijklmnop");
    vi.stubEnv("EMAIL_FROM", "Repairs and Other Services <hello@example.com>");

    expect(getEmailConfig()).toEqual({
      configured: false,
      reason: "EMAIL_FROM uses a placeholder domain.",
    });
  });

  it("rejects malformed sender addresses", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key_abcdefghijklmnop");
    vi.stubEnv("EMAIL_FROM", "hello at example dot co dot uk");

    expect(isEmailConfigured()).toBe(false);
  });
});
