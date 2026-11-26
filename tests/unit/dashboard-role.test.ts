import { describe, expect, it } from "vitest";
import { dashboardRole } from "@/lib/dashboard-role";

describe("dashboardRole", () => {
  it("gives an admin only the admin dashboard", () => {
    expect(
      dashboardRole({
        profile: { role: "admin" } as never,
        providerProfile: { status: "approved" } as never,
      }),
    ).toBe("admin");
  });

  it("gives an account with a provider profile the provider dashboard", () => {
    expect(
      dashboardRole({
        profile: { role: "user" } as never,
        providerProfile: { status: "pending" } as never,
      }),
    ).toBe("provider");
  });

  it("gives everyone else the customer dashboard", () => {
    expect(dashboardRole({ profile: { role: "user" } as never })).toBe(
      "customer",
    );
    expect(dashboardRole({})).toBe("customer");
  });
});
