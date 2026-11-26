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

  it("refuses control characters that the URL parser strips", () => {
    expect(safeNextPath("/\t/example.com")).toBe("/account");
    expect(safeNextPath("/\n/example.com")).toBe("/account");
    expect(safeNextPath("/\r\n/example.com")).toBe("/account");
  });

  it("refuses a path that resolves to another origin", () => {
    expect(safeNextPath("/\t//example.com")).toBe("/account");
  });

  it("uses the fallback it is given", () => {
    expect(safeNextPath("//example.com", "/jobs")).toBe("/jobs");
  });
});

describe("landingPath", () => {
  it("sends an admin to the admin dashboard", () => {
    expect(
      landingPath({
        role: "admin",
        isProvider: false,
        activeDashboard: "customer",
      }),
    ).toBe("/admin");
    // An admin who also has a provider profile still lands in the admin area.
    expect(
      landingPath({
        role: "admin",
        isProvider: true,
        activeDashboard: "provider",
      }),
    ).toBe("/admin");
  });

  it("sends an approved provider to their saved dashboard", () => {
    expect(
      landingPath({
        role: "user",
        isProvider: true,
        activeDashboard: "provider",
      }),
    ).toBe("/provide");
    expect(
      landingPath({
        role: "user",
        isProvider: true,
        activeDashboard: "customer",
      }),
    ).toBe("/jobs");
  });

  it("sends a customer to the customer dashboard", () => {
    expect(
      landingPath({
        role: "user",
        isProvider: false,
        activeDashboard: "customer",
      }),
    ).toBe("/jobs");
    expect(
      landingPath({
        role: null,
        isProvider: false,
        activeDashboard: "customer",
      }),
    ).toBe("/jobs");
  });
});
