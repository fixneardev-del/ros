import { describe, expect, it } from "vitest";
import {
  SEARCH_QUERY_MAX,
  matchesQuery,
  normaliseQuery,
} from "@/lib/search";

describe("normaliseQuery", () => {
  it("trims, collapses whitespace and keeps ordinary text", () => {
    expect(normaliseQuery("  Petra   Mends  ")).toBe("Petra Mends");
    expect(normaliseQuery("G12 8QQ")).toBe("G12 8QQ");
    expect(normaliseQuery("chair-leg")).toBe("chair-leg");
  });

  it("treats missing or blank input as no query", () => {
    expect(normaliseQuery(undefined)).toBe("");
    expect(normaliseQuery(null)).toBe("");
    expect(normaliseQuery("   ")).toBe("");
  });

  it("drops characters that would break a filter or a LIKE pattern", () => {
    expect(normaliseQuery("a,b(c)%d_e*f\\g")).toBe("a b c d e f g");
    expect(normaliseQuery("50%")).toBe("50");
  });

  it("caps the query length", () => {
    expect(normaliseQuery("x".repeat(200))).toHaveLength(SEARCH_QUERY_MAX);
  });
});

describe("matchesQuery", () => {
  it("matches any value, ignoring case", () => {
    expect(matchesQuery("petra", "Petra Mends", null)).toBe(true);
    expect(matchesQuery("g12", null, undefined, "G12, G11")).toBe(true);
    expect(matchesQuery("chair", "Sofa repair")).toBe(false);
  });

  it("matches everything when there is no query", () => {
    expect(matchesQuery("", "anything")).toBe(true);
    expect(matchesQuery("", null)).toBe(true);
  });

  it("compares numbers as text", () => {
    expect(matchesQuery("60", 60)).toBe(true);
  });

  it("never matches when every value is missing", () => {
    expect(matchesQuery("petra", null, undefined)).toBe(false);
  });
});
