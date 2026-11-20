import { afterEach, describe, expect, it, vi } from "vitest";
import { isCronRequest } from "@/lib/cron-auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cron authentication", () => {
  it("accepts the Vercel Bearer header", () => {
    vi.stubEnv("CRON_SECRET", "secret");

    const request = new Request("https://example.com/api/notifications/retry", {
      headers: { authorization: "Bearer secret" },
    });

    expect(isCronRequest(request)).toBe(true);
  });

  it("accepts the legacy custom header", () => {
    vi.stubEnv("CRON_SECRET", "secret");

    const request = new Request("https://example.com/api/notifications/retry", {
      headers: { "x-cron-secret": "secret" },
    });

    expect(isCronRequest(request)).toBe(true);
  });

  it("rejects missing or incorrect credentials", () => {
    vi.stubEnv("CRON_SECRET", "secret");

    expect(
      isCronRequest(new Request("https://example.com/api/notifications/retry")),
    ).toBe(false);
    expect(
      isCronRequest(
        new Request("https://example.com/api/notifications/retry", {
          headers: { authorization: "Bearer wrong" },
        }),
      ),
    ).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    vi.stubEnv("CRON_SECRET", "");

    expect(
      isCronRequest(
        new Request("https://example.com/api/notifications/retry", {
          headers: { authorization: "Bearer secret" },
        }),
      ),
    ).toBe(false);
  });
});
