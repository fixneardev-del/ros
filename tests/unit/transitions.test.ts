import { describe, expect, it } from "vitest";
import {
  assertJobTransition,
  assertOfferTransition,
  canTransitionJob,
  canTransitionOffer,
  TransitionError,
} from "@/lib/transitions";

describe("job transitions", () => {
  it("allows the expected forward moves", () => {
    expect(canTransitionJob("open", "receiving_offers")).toBe(true);
    expect(canTransitionJob("open", "closed")).toBe(true);
    expect(canTransitionJob("receiving_offers", "closed")).toBe(true);
  });

  it("blocks moves out of terminal states", () => {
    expect(canTransitionJob("closed", "open")).toBe(false);
    expect(canTransitionJob("removed", "closed")).toBe(false);
  });

  it("throws a useful error for invalid moves", () => {
    expect(() => assertJobTransition("closed", "open")).toThrow(TransitionError);
  });

  it("does nothing for a valid move", () => {
    expect(() => assertJobTransition("open", "receiving_offers")).not.toThrow();
    expect(() => assertJobTransition("open", "closed")).not.toThrow();
  });
});

describe("offer transitions", () => {
  it("allows submitted offers to be resolved", () => {
    expect(canTransitionOffer("submitted", "accepted")).toBe(true);
    expect(canTransitionOffer("submitted", "declined")).toBe(true);
    expect(canTransitionOffer("submitted", "withdrawn")).toBe(true);
  });

  it("blocks moves out of terminal states", () => {
    expect(canTransitionOffer("accepted", "withdrawn")).toBe(false);
    expect(canTransitionOffer("declined", "accepted")).toBe(false);
  });

  it("throws a useful error for invalid moves", () => {
    expect(() => assertOfferTransition("accepted", "declined")).toThrow(
      TransitionError,
    );
  });

  it("does nothing for a valid move", () => {
    expect(() => assertOfferTransition("submitted", "accepted")).not.toThrow();
    expect(() => assertOfferTransition("submitted", "withdrawn")).not.toThrow();
  });
});
