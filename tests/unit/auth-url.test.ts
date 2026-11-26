import { describe, expect, it } from "vitest";
import { hasAuthErrorFragment } from "@/lib/auth-url";

describe("hasAuthErrorFragment", () => {
  it("detects the fragment Supabase adds when Google code exchange fails", () => {
    const hash =
      "#error=server_error&error_code=unexpected_failure" +
      "&error_description=Unable+to+exchange+external+code%253A+4%252F0A&sb=";
    expect(hasAuthErrorFragment(hash)).toBe(true);
  });

  it("detects an implicit grant error fragment", () => {
    expect(hasAuthErrorFragment("#error=access_denied&error_description=Nope")).toBe(true);
  });

  it("ignores an empty or unrelated fragment", () => {
    expect(hasAuthErrorFragment("")).toBe(false);
    expect(hasAuthErrorFragment("#")).toBe(false);
    expect(hasAuthErrorFragment("#section-2")).toBe(false);
    expect(hasAuthErrorFragment("#access_token=abc&expires_in=3600")).toBe(false);
  });
});
