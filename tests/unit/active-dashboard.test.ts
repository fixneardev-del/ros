import { describe, expect, it, vi } from "vitest";
import { readActiveDashboard } from "@/lib/supabase/active-dashboard";

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

  it("returns customer while the column is missing", async () => {
    const { client } = clientWith({
      data: null,
      error: { code: "42703", message: "column profiles.active_dashboard does not exist" },
    });

    await expect(readActiveDashboard(client, "user-id")).resolves.toBe("customer");
  });

  it("returns customer for an unexpected saved value", async () => {
    const { client } = clientWith({
      data: { active_dashboard: "something-else" },
      error: null,
    });

    await expect(readActiveDashboard(client, "user-id")).resolves.toBe("customer");
  });
});
