import { describe, expect, it } from "vitest";
import { formatDate, formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("shows whole pounds without decimals", () => {
    expect(formatPrice(12000)).toBe("£120");
  });

  it("shows pence when needed", () => {
    expect(formatPrice(12050)).toBe("£120.50");
  });

  it("uses the quote label for null", () => {
    expect(formatPrice(null)).toBe("Quote on inspection");
    expect(formatPrice(undefined)).toBe("Quote on inspection");
  });
});

describe("formatDate", () => {
  it("formats an ISO timestamp in en-GB style", () => {
    expect(formatDate("2026-11-08T12:00:00.000Z")).toBe("8 Nov 2026");
  });
});
