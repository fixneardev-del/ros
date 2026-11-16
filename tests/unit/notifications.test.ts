import { describe, expect, it } from "vitest";
import { isEmailAllowed, notificationHref } from "@/lib/notifications";

const preferences = {
  email_enabled: true,
  job_updates: true,
  offer_updates: true,
};

describe("email preference gate", () => {
  it("allows optional email by default with no preference row", () => {
    expect(isEmailAllowed(null, "job")).toBe(true);
    expect(isEmailAllowed(undefined, "offer")).toBe(true);
  });

  it("blocks both optional categories when email is switched off", () => {
    expect(
      isEmailAllowed({ ...preferences, email_enabled: false }, "job"),
    ).toBe(false);
    expect(
      isEmailAllowed({ ...preferences, email_enabled: false }, "offer"),
    ).toBe(false);
  });

  it("applies each category switch independently", () => {
    const jobOff = { ...preferences, job_updates: false };
    expect(isEmailAllowed(jobOff, "job")).toBe(false);
    expect(isEmailAllowed(jobOff, "offer")).toBe(true);

    const offerOff = { ...preferences, offer_updates: false };
    expect(isEmailAllowed(offerOff, "job")).toBe(true);
    expect(isEmailAllowed(offerOff, "offer")).toBe(false);
  });
});

describe("notification link", () => {
  it("opens the job page when the notification carries a job id", () => {
    expect(
      notificationHref({
        type: "offer.received",
        data: { job_id: "job-1" },
      }),
    ).toBe("/jobs/job-1");
  });

  it("sends a declined offer to the provider's offer list", () => {
    expect(
      notificationHref({
        type: "offer.rejected",
        data: { job_id: "job-1" },
      }),
    ).toBe("/provide/offers");
  });

  it("sends a cancelled job to the provider's job board", () => {
    expect(
      notificationHref({
        type: "job.cancelled",
        data: { job_id: "job-1" },
      }),
    ).toBe("/provide/jobs");
  });

  it("opens the provider dashboard for moderation decisions", () => {
    expect(
      notificationHref({ type: "provider.approved", data: {} }),
    ).toBe("/provide");
  });

  it("falls back to the account page for unknown activity", () => {
    expect(notificationHref({ type: "account.notice", data: {} })).toBe(
      "/account",
    );
  });
});
