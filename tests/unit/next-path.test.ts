import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/next-path";

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
