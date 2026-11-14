import { describe, expect, it } from "vitest";
import { landingPath, safeNextPath } from "@/lib/next-path";

describe("safeNextPath", () => {
  it("keeps a same-site path", () => {
    expect(safeNextPath("/jobs")).toBe("/jobs");
    expect(safeNextPath("/jobs/123?created=1")).toBe("/jobs/123?created=1");
  });

  it("falls back when there is nothing to go to", () => {
    expect(safeNextPath(undefined)).toBe("/account");
    expect(safeNextPath(null)).toBe("/account");
    expect(safeNextPath("")).toBe("/account");
  });

  it("refuses an absolute url", () => {
    expect(safeNextPath("https://example.com")).toBe("/account");
    expect(safeNextPath("http://example.com")).toBe("/account");
  });

  it("refuses a protocol relative url", () => {
    expect(safeNextPath("//example.com")).toBe("/account");
    expect(safeNextPath("///example.com")).toBe("/account");
  });

  it("refuses a backslash trick", () => {
    expect(safeNextPath("/\\example.com")).toBe("/account");
  });

  it("uses the fallback it is given", () => {
    expect(safeNextPath("//example.com", "/jobs")).toBe("/jobs");
  });
});

describe("landingPath", () => {
  it("sends an admin to the admin dashboard", () => {
    expect(landingPath({ role: "admin", isProvider: false })).toBe("/admin");
    expect(
      landingPath({ role: "admin", isProvider: false, requested: "" }),
    ).toBe("/admin");
  });

  it("never sends an admin to the provider dashboard", () => {
    expect(
      landingPath({
        role: "admin",
        isProvider: false,
        requested: "/provide",
      }),
    ).toBe("/admin");
    expect(
      landingPath({
        role: "admin",
        isProvider: false,
        requested: "/provide/jobs",
      }),
    ).toBe("/admin");
  });

  it("honours a requested page that suits the admin", () => {
    expect(
      landingPath({ role: "admin", isProvider: false, requested: "/admin/jobs" }),
    ).toBe("/admin/jobs");
  });

  it("sends a provider to the provider dashboard", () => {
    expect(landingPath({ role: "user", isProvider: true })).toBe("/provide");
  });

  it("sends a customer to the account page", () => {
    expect(landingPath({ role: "user", isProvider: false })).toBe("/account");
  });

  it("honours a requested page for a customer", () => {
    expect(
      landingPath({ role: "user", isProvider: false, requested: "/jobs" }),
    ).toBe("/jobs");
    expect(
      landingPath({ role: "user", isProvider: true, requested: "/provide/jobs" }),
    ).toBe("/provide/jobs");
  });

  it("ignores an unsafe requested page", () => {
    expect(
      landingPath({
        role: "user",
        isProvider: false,
        requested: "//example.com",
      }),
    ).toBe("/account");
    expect(
      landingPath({
        role: "admin",
        isProvider: false,
        requested: "//example.com",
      }),
    ).toBe("/admin");
  });
});
