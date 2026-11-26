import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("home page loads with the main call to action", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Repairs and Other Services", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "One place to find local help with repairs and everyday services.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Post a job" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Offer your services" }).first()).toBeVisible();
  });

  test("home page hero search passes the service and postcode on", async ({
    page,
  }) => {
    await page.goto("/");

    const ticket = page.locator(".l-ticket");

    // The service is chosen by slug. The label changes once the database is
    // seeded, but the slug does not.
    await ticket
      .getByLabel("What do you need help with?")
      .selectOption("furniture-repair");
    await ticket.getByLabel("Postcode").fill("G12 8QQ");
    await ticket.getByRole("button", { name: "Find local help" }).click();

    await expect(page).toHaveURL(/service=furniture-repair/);
    await expect(page).toHaveURL(/postcode=G12\+8QQ/);
  });

  test("search page explains the pilot", async ({ page }) => {
    await page.goto("/search");

    await expect(
      page.getByRole("heading", { name: "Find someone nearby." }),
    ).toBeVisible();
  });

  test("search page refuses a postcode that is not a postcode", async ({
    page,
  }) => {
    await page.goto("/search?service=furniture-repair&postcode=not-a-postcode");

    await expect(
      page.getByRole("heading", { name: "That postcode does not look right" }),
    ).toBeVisible();
  });

  test("search page says when a district is outside the pilot", async ({
    page,
  }) => {
    await page.goto("/search?service=furniture-repair&postcode=EH1 1AA");

    await expect(page.getByText("We are not in EH1 yet.")).toBeVisible();
  });

  test("the legal pages are reachable from the footer", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo");
    await expect(
      footer.getByText(/Have a skill to offer\? You don't need to run a business/),
    ).toHaveCount(0);
    await expect(
      footer.getByText(/No payments taken\. Agree the work and pay the provider directly/),
    ).toHaveCount(0);

    await footer.getByRole("link", { name: "Privacy" }).click();
    await expect(
      page.getByRole("heading", { name: "Privacy notice" }),
    ).toBeVisible();
  });

  for (const [heading, path] of [
    ["Privacy notice", "/privacy"],
    ["Terms of use", "/terms"],
    ["Cookie notice", "/cookies"],
  ] as const) {
    test(`${heading} renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    });
  }

  test("legal pages are marked as pilot copy", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText("Pilot copy.")).toBeVisible();
  });

  test("an unknown page shows the 404 page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "We couldn't find that page." }),
    ).toBeVisible();
  });
});

test.describe("authentication", () => {
  test("the register form requires the terms", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: "Create an account" }),
    ).toBeVisible();
    await expect(page.getByRole("checkbox")).not.toBeChecked();
    await expect(page.getByText("terms", { exact: true })).toBeVisible();
  });

  test("login and registration offer Google sign-in", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();

    await page.goto("/register");
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
  });

  test("Google registration requires the terms", async ({ page }) => {
    await page.goto("/register");

    await page.getByRole("button", { name: "Continue with Google" }).click();

    await expect(
      page.getByText(
        "Accept the terms and privacy notice before continuing with Google.",
      ),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test("the Google button starts the OAuth flow with the safe callback", async ({
    page,
  }) => {
    const authorizeRequest = page.waitForRequest(
      (request) => request.url().includes("/auth/v1/authorize"),
    );

    await page.goto("/login?next=/post-job");
    await page.getByRole("button", { name: "Continue with Google" }).click();

    const request = await authorizeRequest;
    const authorizeUrl = new URL(request.url());
    expect(authorizeUrl.searchParams.get("provider")).toBe("google");

    const redirectTo = new URL(
      authorizeUrl.searchParams.get("redirect_to") ?? "",
    );
    expect(redirectTo.pathname).toBe("/auth/callback");
    expect(redirectTo.searchParams.get("next")).toBe("/post-job");
  });

  test("signing in from a protected page comes back to it", async ({ page }) => {
    await page.goto("/post-job");

    await expect(page).toHaveURL(/\/login\?next=%2Fpost-job/);
  });

  test("registering carries the page you were heading for", async ({ page }) => {
    await page.goto("/post-job");

    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL(/\/register\?next=%2Fpost-job/);

    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fpost-job/);
  });

  test("the password reset page accepts an email", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: "Forgot your password?" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});

test.describe("navigation", () => {
  test("the mobile menu opens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await page.locator("header summary").click();

    await expect(
      page
        .getByRole("navigation", { name: "Mobile" })
        .getByRole("link", { name: "Find help" }),
    ).toBeVisible();
  });

  test("the skip link is the first thing focused", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  });
});

test.describe("security", () => {
  test("admin routes send an anonymous visitor to sign in", async ({ page }) => {
    const response = await page.request.get("/admin", { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/login?next=%2Fadmin");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  });

  test("security headers are present", async ({ page }) => {
    const response = await page.goto("/");

    const headers = response?.headers() ?? {};
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });
});
