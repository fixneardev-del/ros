import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => {
    delete process.env.E2E_TEST;
  });

  it("throttles repeated attempts outside the browser suite", () => {
    expect(checkRateLimit("unit-throttle", 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit("unit-throttle", 1, 60_000).allowed).toBe(false);
  });

  it("allows repeated attempts in the browser suite", () => {
    process.env.E2E_TEST = "1";

    expect(checkRateLimit("e2e-throttle", 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit("e2e-throttle", 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit("e2e-throttle", 1, 60_000).remaining).toBe(1);
  });
});
