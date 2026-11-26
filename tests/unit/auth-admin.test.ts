import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { getAccountState } from "@/lib/auth-admin";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabase: () => null,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const userId = "328dbf74-b3a3-4386-9bd4-f1ac911be2de";

function clientWith(responses: Record<string, unknown>) {
  const from = vi.fn((table: string) => {
    let selected = "";
    const builder = {
      select: vi.fn((columns: string) => {
        selected = columns;
        return builder;
      }),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };

    builder.eq.mockReturnValue(builder);
    builder.maybeSingle.mockImplementation(() =>
      Promise.resolve(
        responses[`${table}:${selected}`] ?? responses[table] ?? { data: null },
      ),
    );

    return builder;
  });

  return { from } as never;
}

describe("getAccountState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the approved provider state and saved dashboard through the sign-in token", async () => {
    vi.mocked(createClient).mockReturnValue(
      clientWith({
        profiles: { data: { role: "user", active_dashboard: "provider" } },
        provider_profiles: {
          data: { user_id: userId, status: "approved" },
        },
      }),
    );

    await expect(getAccountState(userId, "access-token")).resolves.toEqual({
      role: "user",
      isProvider: true,
      activeDashboard: "provider",
    });

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "publishable-key",
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer access-token" } },
      }),
    );
  });

  it("keeps a customer as a customer when they have no provider profile", async () => {
    vi.mocked(createClient).mockReturnValue(
      clientWith({
        profiles: { data: { role: "user", active_dashboard: "customer" } },
      }),
    );

    await expect(getAccountState(userId, "access-token")).resolves.toEqual({
      role: "user",
      isProvider: false,
      activeDashboard: "customer",
    });
  });

  it("does not treat a pending application as a provider account", async () => {
    vi.mocked(createClient).mockReturnValue(
      clientWith({
        profiles: { data: { role: "user", active_dashboard: "customer" } },
        provider_profiles: { data: { user_id: userId, status: "pending" } },
      }),
    );

    await expect(getAccountState(userId, "access-token")).resolves.toEqual({
      role: "user",
      isProvider: false,
      activeDashboard: "customer",
    });
  });

  it("keeps an admin as an admin before the dashboard column is deployed", async () => {
    vi.mocked(createClient).mockReturnValue(
      clientWith({
        "profiles:role": { data: { role: "admin" } },
        "profiles:active_dashboard": {
          data: null,
          error: { code: "42703", message: "column does not exist" },
        },
      }),
    );

    await expect(getAccountState(userId, "access-token")).resolves.toEqual({
      role: "admin",
      isProvider: false,
      activeDashboard: "customer",
    });
  });

  it("falls back to customer when a provider's saved dashboard cannot be read", async () => {
    vi.mocked(createClient).mockReturnValue(
      clientWith({
        "profiles:role": { data: { role: "user" } },
        "profiles:active_dashboard": {
          data: null,
          error: { code: "42703", message: "column does not exist" },
        },
        provider_profiles: {
          data: { user_id: userId, status: "approved" },
        },
      }),
    );

    await expect(getAccountState(userId, "access-token")).resolves.toEqual({
      role: "user",
      isProvider: true,
      activeDashboard: "customer",
    });
  });
});
