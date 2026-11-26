import { describe, expect, it } from "vitest";
import {
  availableDashboards,
  canSwitchDashboard,
  dashboardRole,
  isActiveDashboard,
} from "@/lib/dashboard-role";

describe("dashboardRole", () => {
  it("gives an admin only the admin dashboard", () => {
    const context = {
      profile: { role: "admin", active_dashboard: "provider" } as never,
      providerProfile: { status: "approved" } as never,
    };

    expect(dashboardRole(context)).toBe("admin");
    expect(availableDashboards(context)).toEqual(["admin"]);
  });

  it("uses the provider dashboard when an approved provider has selected it", () => {
    expect(
      dashboardRole({
        profile: { role: "user", active_dashboard: "provider" } as never,
        providerProfile: { status: "approved" } as never,
      }),
    ).toBe("provider");
  });

  it("keeps an approved provider on the customer dashboard until they switch", () => {
    const context = {
      profile: { role: "user", active_dashboard: "customer" } as never,
      providerProfile: { status: "approved" } as never,
    };

    expect(dashboardRole(context)).toBe("customer");
    expect(canSwitchDashboard(context)).toBe(true);
  });

  it("opens the provider dashboard when the saved choice is unavailable", () => {
    expect(
      dashboardRole({
        profile: { role: "user", active_dashboard: undefined } as never,
        providerProfile: { status: "approved" } as never,
      }),
    ).toBe("provider");
  });

  it("does not open the provider dashboard for an unapproved application", () => {
    for (const status of ["pending", "rejected", "suspended"]) {
      const context = {
        profile: { role: "user", active_dashboard: "provider" } as never,
        providerProfile: { status } as never,
      };

      expect(dashboardRole(context)).toBe("customer");
      expect(canSwitchDashboard(context)).toBe(false);
    }
  });

  it("gives everyone else the customer dashboard", () => {
    expect(
      dashboardRole({
        profile: { role: "user", active_dashboard: "customer" } as never,
      }),
    ).toBe("customer");
    expect(dashboardRole({})).toBe("customer");
  });
});

describe("isActiveDashboard", () => {
  it("accepts only the two dashboards", () => {
    expect(isActiveDashboard("customer")).toBe(true);
    expect(isActiveDashboard("provider")).toBe(true);
    expect(isActiveDashboard("admin")).toBe(false);
    expect(isActiveDashboard(null)).toBe(false);
  });
});
