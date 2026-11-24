import { describe, expect, it } from "vitest";
import { accountSchema } from "@/lib/schemas/account";
import { registerSchema, resetPasswordSchema } from "@/lib/schemas/auth";
import { jobSchema } from "@/lib/schemas/job";
import { parsePricePence } from "@/lib/schemas/offer";
import { reportSchema } from "@/lib/schemas/search";

const validUuid = "11111111-1111-4111-8111-111111111111";

describe("accountSchema", () => {
  it("accepts contact details and discards a submitted name", () => {
    const result = accountSchema.safeParse({
      fullName: "Forged Name",
      phone: " 07700 900123 ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ phone: "07700 900123" });
    }
  });
});

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "a-long-password",
      acceptedTerms: true,
    });
    expect(result.success).toBe(true);
  });

  it("requires terms acceptance", () => {
    const result = registerSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "a-long-password",
      acceptedTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects short passwords", () => {
    const result = registerSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "short",
      acceptedTerms: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires the account being reset", () => {
    const result = resetPasswordSchema.safeParse({
      password: "a-long-password",
      confirmPassword: "a-long-password",
    });
    expect(result.success).toBe(false);
  });

  it("reports mismatched passwords on confirmPassword", () => {
    const result = resetPasswordSchema.safeParse({
      email: "ada@example.com",
      password: "a-long-password",
      confirmPassword: "another-password",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});

describe("jobSchema", () => {
  it("accepts a complete job", () => {
    const result = jobSchema.safeParse({
      categoryId: validUuid,
      title: "Fix a leaking tap",
      description: "The kitchen tap has dripped for a week and needs a new washer.",
      postcode: "G12 7AA",
      timeframe: "this_week",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a too-short description", () => {
    const result = jobSchema.safeParse({
      categoryId: validUuid,
      title: "Fix a leaking tap",
      description: "Dripping",
      postcode: "G12 7AA",
      timeframe: "this_week",
    });
    expect(result.success).toBe(false);
  });
});

describe("parsePricePence", () => {
  it("parses pounds into integer pence", () => {
    expect(parsePricePence("£120")).toBe(12000);
    expect(parsePricePence("120.50")).toBe(12050);
  });

  it("treats blank values as quote on inspection", () => {
    expect(parsePricePence("")).toBeNull();
    expect(parsePricePence(undefined)).toBeNull();
  });

  it("rejects invalid or out-of-range prices", () => {
    expect(parsePricePence("abc")).toBeUndefined();
    expect(parsePricePence("-5")).toBeUndefined();
    expect(parsePricePence("100001")).toBeUndefined();
  });
});

describe("reportSchema", () => {
  it("requires a reason of at least 10 characters", () => {
    const result = reportSchema.safeParse({
      targetType: "job",
      targetId: validUuid,
      reason: "too short",
    });
    expect(result.success).toBe(false);
  });
});
