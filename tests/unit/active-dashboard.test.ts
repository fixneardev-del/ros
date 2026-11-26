import { describe, expect, it, vi } from "vitest";
import {
  dashboardCookieValue,
  readActiveDashboard,
  readDashboardCookie,
} from "@/lib/supabase/active-dashboard";

function clientWith(result: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return { client: { from }, select, eq, maybeSingle };
}

describe("readActiveDashboard", () => {
  it("returns the saved provider dashboard", async () => {
    const { client, select, eq } = clientWith({
      data: { active_dashboard: "provider" },
      error: null,
    });

    await expect(readActiveDashboard(client, "user-id")).resolves.toBe("provider");
    expect(select).toHaveBeenCalledWith("active_dashboard");
    expect(eq).toHaveBeenCalledWith("id", "user-id");
  });

  it("returns the saved customer dashboard", async () => {
    const { client } = clientWith({
      data: { active_dashboard: "customer" },
      error: null,
    });

    await expect(readActiveDashboard(client, "user-id")).resolves.toBe("customer");
  });

  it("returns provider while the column is missing", async () => {
    const { client } = clientWith({
      data: null,
      error: { code: "42703", message: "column profiles.active_dashboard does not exist" },
    });

    await expect(readActiveDashboard(client, "user-id")).resolves.toBe("provider");
  });

  it("returns provider for an unexpected saved value", async () => {
    const { client } = clientWith({
      data: { active_dashboard: "something-else" },
      error: null,
    });

    await expect(readActiveDashboard(client, "user-id")).resolves.toBe("provider");
  });

  it("uses the user's switched choice instead of the database value", async () => {
    const { client, select } = clientWith({
      data: { active_dashboard: "provider" },
      error: null,
    });

    await expect(
      readActiveDashboard(client, "user-id", "customer"),
    ).resolves.toBe("customer");
    expect(select).not.toHaveBeenCalled();
  });
});

describe("readDashboardCookie", () => {
  it("reads a choice saved for this user", () => {
    expect(
      readDashboardCookie(dashboardCookieValue("user-id", "provider"), "user-id"),
    ).toBe("provider");
    expect(
      readDashboardCookie(dashboardCookieValue("user-id", "customer"), "user-id"),
    ).toBe("customer");
  });

  it("ignores another user's choice or a malformed value", () => {
    expect(readDashboardCookie("user-id:provider", "other-id")).toBeNull();
    expect(readDashboardCookie("user-id:admin", "user-id")).toBeNull();
    expect(readDashboardCookie(undefined, "user-id")).toBeNull();
  });
});
