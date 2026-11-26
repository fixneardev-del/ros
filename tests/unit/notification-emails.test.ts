import { describe, expect, it } from "vitest";
import { buildEmailMessages } from "@/lib/emails/templates";
import {
  emailCategoryForTemplate,
  eventForTemplate,
  matchesOutboxRow,
} from "@/lib/emails/events";

const siteUrl = "https://example.com";

describe("marketplace email templates", () => {
  it("notifies the provider and the admin when an application arrives", () => {
    const messages = buildEmailMessages(
      "provider.applied",
      {
        providerEmail: "petra@example.com",
        providerName: "Petra",
        adminEmail: "admin@example.com",
      },
      siteUrl,
    );

    expect(messages).toHaveLength(2);
    expect(messages.map((message) => message.to)).toEqual([
      "petra@example.com",
      "admin@example.com",
    ]);
    expect(messages[0].html).toContain(`${siteUrl}/provide`);
    expect(messages[1].html).toContain(`${siteUrl}/admin/providers`);
  });

  it("sends one approval email to the provider", () => {
    const [message] = buildEmailMessages(
      "provider.approved",
      { providerEmail: "petra@example.com", providerName: "Petra" },
      siteUrl,
    );

    expect(message.template).toBe("provider.approved");
    expect(message.to).toBe("petra@example.com");
    expect(message.html).toContain(`${siteUrl}/provide/jobs`);
    expect(message.text).toContain(`${siteUrl}/provide/jobs`);
    expect(message.html).toContain("Your customer dashboard is still available");
    expect(message.text).toContain("Your customer dashboard is still available");
  });

  it("sends a contact message to the admin with a reply prompt", () => {
    const [message] = buildEmailMessages(
      "contact.submitted",
      {
        adminEmail: "admin@example.com",
        senderName: "Nina",
        senderEmail: "nina@example.com",
        subject: "Question about applications",
        message: "How long does provider review take?",
      },
      siteUrl,
    );

    expect(message.template).toBe("contact.submitted");
    expect(message.to).toBe("admin@example.com");
    expect(message.subject).toContain("Question about applications");
    expect(message.html).toContain("nina@example.com");
    expect(message.html).toContain("How long does provider review take?");
    expect(message.text).toContain("Reply directly to the sender");
  });

  it("sends one rejection email with the reason", () => {
    const [message] = buildEmailMessages(
      "provider.rejected",
      {
        providerEmail: "petra@example.com",
        providerName: "Petra",
        reason: "The insurance document had expired.",
      },
      siteUrl,
    );

    expect(message.template).toBe("provider.rejected");
    expect(message.to).toBe("petra@example.com");
    expect(message.html).toContain("The insurance document had expired.");
    expect(message.text).toContain("The insurance document had expired.");
  });

  it.each(["provider.suspended", "provider.reinstated", "provider.removed"] as const)(
    "sends one %s email to the provider",
    (event) => {
      const [message] = buildEmailMessages(
        event,
        { providerEmail: "petra@example.com", providerName: "Petra", reason: "Review" },
        siteUrl,
      );

      expect(message.template).toBe(event);
      expect(message.to).toBe("petra@example.com");
      expect(message.text.length).toBeGreaterThan(0);
    },
  );

  it("notifies the customer and the admin when a job is posted", () => {
    const messages = buildEmailMessages(
      "job.created",
      {
        customerEmail: "nina@example.com",
        customerName: "Nina",
        adminEmail: "admin@example.com",
        jobTitle: "Fix a leaking tap",
        jobId: "job-1",
        district: "G12",
      },
      siteUrl,
    );

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      template: "job.created.customer",
      to: "nina@example.com",
    });
    expect(messages[0].html).toContain(`${siteUrl}/jobs/job-1`);
    expect(messages[1]).toMatchObject({
      template: "job.created.admin",
      to: "admin@example.com",
    });
    expect(messages[1].html).toContain(`${siteUrl}/admin/jobs`);
  });

  it("sends one new-offer email to the customer", () => {
    const [message] = buildEmailMessages(
      "offer.created",
      {
        customerEmail: "nina@example.com",
        providerName: "Petra",
        jobTitle: "Fix a leaking tap",
        jobId: "job-1",
      },
      siteUrl,
    );

    expect(message.template).toBe("offer.created");
    expect(message.to).toBe("nina@example.com");
    expect(message.html).toContain(`${siteUrl}/jobs/job-1`);
  });

  it("sends one accepted-offer email to the provider", () => {
    const [message] = buildEmailMessages(
      "offer.accepted",
      {
        providerEmail: "petra@example.com",
        providerName: "Petra",
        jobTitle: "Fix a leaking tap",
        jobId: "job-1",
      },
      siteUrl,
    );

    expect(message.template).toBe("offer.accepted");
    expect(message.to).toBe("petra@example.com");
    expect(message.html).toContain(`${siteUrl}/jobs/job-1`);
  });

  it("sends one declined-offer email to the provider", () => {
    const [message] = buildEmailMessages(
      "offer.declined",
      { providerEmail: "petra@example.com", jobTitle: "Fix a leaking tap" },
      siteUrl,
    );

    expect(message.template).toBe("offer.declined");
    expect(message.to).toBe("petra@example.com");
    expect(message.html).toContain(`${siteUrl}/provide/jobs`);
  });

  it("sends one cancellation email to a provider with an offer", () => {
    const [message] = buildEmailMessages(
      "job.cancelled",
      {
        providerEmail: "petra@example.com",
        jobTitle: "Fix a leaking tap",
        jobId: "job-1",
      },
      siteUrl,
    );

    expect(message.template).toBe("job.cancelled");
    expect(message.to).toBe("petra@example.com");
    expect(message.text).toContain("Fix a leaking tap");
    expect(message.html).toContain(`${siteUrl}/provide/jobs`);
  });

  it("sends one completion email to the other participant", () => {
    const [message] = buildEmailMessages(
      "job.completed",
      {
        recipientEmail: "nina@example.com",
        jobTitle: "Fix a leaking tap",
        jobId: "job-1",
      },
      siteUrl,
    );

    expect(message.template).toBe("job.completed");
    expect(message.to).toBe("nina@example.com");
    expect(message.html).toContain(`${siteUrl}/jobs/job-1`);
  });

  it("skips a trigger when the recipient address is missing", () => {
    expect(buildEmailMessages("provider.approved", {}, siteUrl)).toEqual([]);
    expect(
      buildEmailMessages("job.created", { jobTitle: "Fix a tap", jobId: "job-1" }, siteUrl),
    ).toEqual([]);
  });
});

describe("notification retry mapping", () => {
  it.each([
    ["auth.welcome", "auth.welcome"],
    ["auth.signed_in", "auth.signed_in"],
    ["provider.applied.provider", "provider.applied"],
    ["provider.applied.admin", "provider.applied"],
    ["provider.approved", "provider.approved"],
    ["provider.rejected", "provider.rejected"],
    ["provider.more_info_requested", "provider.more_info_requested"],
    ["provider.suspended", "provider.suspended"],
    ["provider.reinstated", "provider.reinstated"],
    ["provider.removed", "provider.removed"],
    ["job.created.customer", "job.created"],
    ["job.created.admin", "job.created"],
    ["offer.created", "offer.created"],
    ["offer.accepted", "offer.accepted"],
    ["offer.declined", "offer.declined"],
    ["job.cancelled", "job.cancelled"],
    ["job.completed", "job.completed"],
    ["job.removed", "job.removed"],
    ["waitlist.joined", "waitlist.joined"],
    ["contact.submitted", "contact.submitted"],
    ["report.created", "report.created"],
  ] as const)("maps %s back to %s", (template, event) => {
    expect(eventForTemplate(template)).toBe(event);
  });

  it("ignores an unknown template", () => {
    expect(eventForTemplate("auth.password_reset")).toBeNull();
    expect(eventForTemplate("unknown")).toBeNull();
  });

  it("maps only optional templates to a preference category", () => {
    expect(emailCategoryForTemplate("offer.declined")).toBe("offer");
    expect(emailCategoryForTemplate("job.completed")).toBe("job");
    expect(emailCategoryForTemplate("offer.accepted")).toBeNull();
    expect(emailCategoryForTemplate("provider.approved")).toBeNull();
  });

  it("does not let a retry pick the other recipient's message", () => {
    const messages = buildEmailMessages(
      "job.created",
      {
        customerEmail: "nina@example.com",
        customerName: "Nina",
        adminEmail: "admin@example.com",
        jobTitle: "Fix a leaking tap",
        jobId: "job-1",
      },
      siteUrl,
    );

    const adminRow = { template: "job.created.admin", to_email: "admin@example.com" };
    const customerMessage = messages.find((message) =>
      matchesOutboxRow(message, adminRow),
    );

    expect(customerMessage?.template).toBe("job.created.admin");
    expect(customerMessage?.to).toBe("admin@example.com");
  });
});
