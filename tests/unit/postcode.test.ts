import { describe, expect, it } from "vitest";
import { normalisePostcode, postcodeDistrict } from "@/lib/postcode";

describe("normalisePostcode", () => {
  it("uppercases and inserts the inward-code space", () => {
    expect(normalisePostcode("g127aa")).toBe("G12 7AA");
    expect(normalisePostcode("  g1  1aa ")).toBe("G1 1AA");
  });

  it("rejects malformed postcodes", () => {
    expect(normalisePostcode("not a postcode")).toBeNull();
    expect(normalisePostcode("G12")).toBeNull();
    expect(normalisePostcode("")).toBeNull();
  });
});

describe("postcodeDistrict", () => {
  it("returns the outward code", () => {
    expect(postcodeDistrict("G12 7AA")).toBe("G12");
    expect(postcodeDistrict("g4 9xx")).toBe("G4");
  });

  it("returns null for invalid input", () => {
    expect(postcodeDistrict("Glasgow")).toBeNull();
  });
});
