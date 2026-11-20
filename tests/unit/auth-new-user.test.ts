import { describe, expect, it } from "vitest";
import { isFirstTimeSignIn } from "@/lib/auth-new-user";

const now = new Date("2026-11-19T12:00:00Z").getTime();

describe("first-time sign-in detection", () => {
  it("recognises a newly created account on its first login", () => {
    expect(
      isFirstTimeSignIn(
        {
          created_at: "2026-11-19T11:59:55Z",
          last_sign_in_at: "2026-11-19T11:59:55Z",
        },
        now,
      ),
    ).toBe(true);
  });

  it("does not send another welcome on a repeat login", () => {
    expect(
      isFirstTimeSignIn(
        {
          created_at: "2026-11-19T11:59:55Z",
          last_sign_in_at: "2026-11-19T12:00:00Z",
        },
        now,
      ),
    ).toBe(false);
  });

  it("does not treat an old account as new even if a timestamp is missing", () => {
    expect(
      isFirstTimeSignIn(
        { created_at: "2026-11-01T12:00:00Z", last_sign_in_at: null },
        now,
      ),
    ).toBe(false);
  });

  it("rejects malformed timestamps", () => {
    expect(
      isFirstTimeSignIn({ created_at: "not-a-date", last_sign_in_at: null }, now),
    ).toBe(false);
  });
});
