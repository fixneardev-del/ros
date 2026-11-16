import { describe, expect, it } from "vitest";
import { buildEmailMessages } from "@/lib/emails/templates";

const siteUrl = "https://example.com";

describe("auth email templates", () => {
  it("builds a welcome email for a new account", () => {
    const messages = buildEmailMessages(
      "auth.welcome",
      { email: "nina@example.com", name: "Nina", needsConfirmation: false },
      siteUrl,
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      template: "auth.welcome",
      to: "nina@example.com",
      subject: "Welcome to Repairs and Other Services",
    });
    expect(messages[0].html).toContain("Thanks for joining, Nina.");
    expect(messages[0].html).toContain(`${siteUrl}/account`);
    expect(messages[0].text).toContain("You can log in now and get started.");
  });

  it("asks for confirmation when Supabase needs it", () => {
    const [message] = buildEmailMessages(
      "auth.welcome",
      { email: "nina@example.com", name: "Nina", needsConfirmation: true },
      siteUrl,
    );

    expect(message.subject).toBe("Confirm your email for Repairs and Other Services");
    expect(message.text).toContain("confirmation email");
  });

  it("escapes a name before putting it in the HTML", () => {
    const [message] = buildEmailMessages(
      "auth.welcome",
      {
        email: "nina@example.com",
        name: '<script>alert("x")</script>',
        needsConfirmation: false,
      },
      siteUrl,
    );

    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
  });

  it("builds a sign-in notice with the time of the sign in", () => {
    const [message] = buildEmailMessages(
      "auth.signed_in",
      {
        email: "nina@example.com",
        name: "Nina",
        signedInAt: "2026-11-14T17:05:00.000Z",
      },
      siteUrl,
    );

    expect(message.template).toBe("auth.signed_in");
    expect(message.subject).toBe("New sign-in to your account");
    expect(message.html).toContain("14 November 2026");
    expect(message.html).toContain(`${siteUrl}/forgot-password`);
    expect(message.text).toContain("If this was not you, reset your password.");
  });

  it("builds a reset email with both a link and a code", () => {
    const [message] = buildEmailMessages(
      "auth.password_reset",
      {
        email: "nina@example.com",
        name: "Nina",
        resetUrl: `${siteUrl}/auth/callback?token_hash=abc`,
        code: "123456",
        expiresInMinutes: 60,
      },
      siteUrl,
    );

    expect(message.template).toBe("auth.password_reset");
    expect(message.html).toContain(`${siteUrl}/auth/callback?token_hash=abc`);
    expect(message.html).toContain("123456");
    expect(message.html).toContain("expire in 1 hour");
    expect(message.html).toContain("Your password will not change.");
    expect(message.text).toContain("Or enter this code: 123456.");
  });

  it("does not build a reset email without a link", () => {
    expect(
      buildEmailMessages("auth.password_reset", { email: "nina@example.com" }, siteUrl),
    ).toEqual([]);
  });

  it("ignores an unknown event", () => {
    expect(buildEmailMessages("nope", {}, siteUrl)).toEqual([]);
  });
});
