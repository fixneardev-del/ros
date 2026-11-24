import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, DEMO_PASSWORD, adminClient, rowsFor } from "./helpers";

/**
 * The signed-in flows. These cover the parts of the marketplace that a
 * visitor never sees: posting a job, sending and accepting an offer, the
 * contact handover and the admin decisions.
 *
 * Each test creates the data it needs, so the tests do not depend on each
 * other and can run in parallel. The sessions come from `auth.setup.ts`.
 */
const customerState = "tests/e2e/.auth/customer.json";
const providerState = "tests/e2e/.auth/provider.json";
const adminState = "tests/e2e/.auth/admin.json";

const CATEGORY = {
  furniture: "Furniture repair and refurbishment",
  clothing: "Clothing alterations and repair",
};

/**
 * The action forms confirm before they run. Playwright dismisses dialogs by
 * default, so they have to be accepted explicitly.
 */
function acceptDialogs(page: Page) {
  page.on("dialog", (dialog) => dialog.accept());
}

let sequence = 0;

function unique(prefix: string) {
  sequence += 1;
  return `${prefix} ${Date.now()}-${sequence}`;
}

async function postJob(
  page: Page,
  options: {
    category: string;
    title: string;
    description: string;
    postcode: string;
  },
) {
  await page.goto("/post-job");
  await page
    .getByLabel("What do you need?")
    .selectOption({ label: options.category });
  await page.getByLabel("Job title").fill(options.title);
  await page.getByLabel("Describe the job").fill(options.description);
  await page.getByLabel("Postcode").fill(options.postcode);
  await page.getByRole("button", { name: "Post job" }).click();

  await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]+\?created=1/);
  return new URL(page.url()).pathname.split("/").pop()!;
}

async function sendOffer(
  page: Page,
  jobId: string,
  message: string,
  priceInPounds: string,
) {
  await page.goto(`/jobs/${jobId}`);
  await page.getByLabel("Your message").fill(message);
  await page.getByLabel("Indicative price in pounds").fill(priceInPounds);
  await page.getByRole("button", { name: "Send offer" }).click();

  await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}\\?offer=sent`));
}

test.describe("sign in", () => {
  // These check the sign-in rules, so they start signed out.
  test.use({ storageState: { cookies: [], origins: [] } });

  async function signIn(page: Page, email: string, next?: string) {
    await page.goto(
      next ? `/login?next=${encodeURIComponent(next)}` : "/login",
    );
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  }

  test("an admin lands on the admin dashboard", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin);
    await expect(page).toHaveURL(/\/admin/);
    await expect(
      page.getByRole("heading", { name: "Marketplace overview" }),
    ).toBeVisible();
  });

  test("an admin never lands on the provider dashboard", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin, "/provide");
    await expect(page).not.toHaveURL(/\/provide/);
    await expect(page).toHaveURL(/\/admin/);
  });

  test("a provider lands on the provider dashboard", async ({ page }) => {
    await signIn(page, ACCOUNTS.provider);
    await expect(page).toHaveURL(/\/provide/);
  });

  test("a customer lands on the account page", async ({ page }) => {
    await signIn(page, ACCOUNTS.customer);
    await expect(page).toHaveURL(/\/account/);
  });

  test("a requested provider page does not override a customer's platform", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.customer, "/provide");
    await expect(page).toHaveURL(/\/account/);
  });

  test("a requested admin page does not override the admin home", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.admin, "/admin/jobs");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("a signed-out visitor is sent to sign in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});

test.describe("the customer dashboard", () => {
  test.use({ storageState: customerState });

  test("a customer posts a job and a provider sends an offer", async ({
    page,
    browser,
  }) => {
    const jobId = await postJob(page, {
      category: CATEGORY.furniture,
      title: unique("Fix a loose kitchen drawer runner"),
      description:
        "The drawer runner on the kitchen unit has come loose and needs re-fixing properly.",
      postcode: "G12 8QQ",
    });

    const jobs = await rowsFor("job_requests", "id", jobId);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].postcode_district).toBe("G12");
    expect(jobs[0].status).toBe("open");

    const providerContext = await browser.newContext({
      storageState: providerState,
    });
    const providerPage = await providerContext.newPage();
    await sendOffer(
      providerPage,
      jobId,
      "I can re-fix the runner and test the drawer on Thursday.",
      "45",
    );

    const offers = await rowsFor("provider_offers", "job_id", jobId);
    expect(offers).toHaveLength(1);
    expect(offers[0].indicative_price_pence).toBe(4500);
    expect(offers[0].status).toBe("submitted");

    await providerContext.close();
  });

  test("accepting an offer closes the job and releases the contact details", async ({
    page,
    browser,
  }) => {
    acceptDialogs(page);

    const jobId = await postJob(page, {
      category: CATEGORY.furniture,
      title: unique("Re-glue a dining chair leg"),
      description:
        "One leg has come away from the seat and the chair rocks when you sit on it.",
      postcode: "G12 8QQ",
    });

    const providerContext = await browser.newContext({
      storageState: providerState,
    });
    const providerPage = await providerContext.newPage();
    await sendOffer(providerPage, jobId, "I can do this on Thursday.", "60");

    await page.goto(`/jobs/${jobId}`);
    await page.getByRole("button", { name: "Accept offer" }).click();

    // The customer sees both sets of contact details once an offer is
    // accepted, and the provider's email is now visible.
    await expect(
      page.getByRole("heading", {
        name: "You can now contact each other directly",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: ACCOUNTS.provider }),
    ).toBeVisible();

    const { data: updated } = await adminClient()
      .from("job_requests")
      .select("status, accepted_offer_id")
      .eq("id", jobId)
      .single();

    expect(updated?.status).toBe("closed");
    expect(updated?.accepted_offer_id).toBeTruthy();

    // The provider sees the customer's details too.
    await providerPage.goto(`/jobs/${jobId}`);
    await expect(
      providerPage.getByRole("heading", {
        name: "You can now contact each other directly",
      }),
    ).toBeVisible();
    await expect(
      providerPage.getByRole("link", { name: ACCOUNTS.customer }),
    ).toBeVisible();

    await providerContext.close();
  });

  test("a provider cannot see a job outside their services", async ({
    page,
    browser,
  }) => {
    // The demo provider covers furniture, woodwork and small fixes, so a
    // clothing job is outside their scope.
    const jobId = await postJob(page, {
      category: CATEGORY.clothing,
      title: unique("Take up a pair of curtains"),
      description:
        "The curtains are too long for the window and need taking up by about ten centimetres.",
      postcode: "G12 8QQ",
    });

    const providerContext = await browser.newContext({
      storageState: providerState,
    });
    const providerPage = await providerContext.newPage();
    await providerPage.goto(`/jobs/${jobId}`);

    // Row level security hides the job entirely, so the provider gets the
    // dashboard 404 rather than a page that reveals the job exists.
    await expect(
      providerPage.getByRole("heading", {
        name: "We couldn't find that page.",
      }),
    ).toBeVisible();
    await expect(
      providerPage.locator("#main").getByRole("link", { name: "My jobs" }),
    ).toBeVisible();

    await providerContext.close();
  });
});

test.describe("the admin dashboard", () => {
  test.use({ storageState: adminState });

  test("approving a provider makes them public and notifies them", async ({
    page,
  }) => {
    // The demo data has a pending application. Reset it so the test can run
    // more than once.
    const pendingId = "bbbbbbbb-0000-4000-8000-000000000003";
    await adminClient()
      .from("provider_profiles")
      .update({
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
      })
      .eq("user_id", pendingId);

    const notificationsBefore = await rowsFor(
      "notification_deliveries",
      "to_email",
      ACCOUNTS.pending,
    );

    await page.goto(`/admin/providers/${pendingId}`);
    await page.getByRole("button", { name: "Approve provider" }).click();
    await expect(page).toHaveURL(/\/admin\/providers\?ok=/);

    const { data: updated } = await adminClient()
      .from("provider_profiles")
      .select("status, reviewed_by, reviewed_at")
      .eq("user_id", pendingId)
      .single();

    expect(updated?.status).toBe("approved");
    expect(updated?.reviewed_by).toBeTruthy();
    expect(updated?.reviewed_at).toBeTruthy();

    const notificationsAfter = await rowsFor(
      "notification_deliveries",
      "to_email",
      ACCOUNTS.pending,
    );
    expect(notificationsAfter.length).toBeGreaterThan(
      notificationsBefore.length,
    );
    expect(
      notificationsAfter.some((row) => row.template === "provider.approved"),
    ).toBe(true);

    const audit = await rowsFor("audit_log", "entity_id", pendingId);
    expect(audit.some((row) => row.action === "provider.approved")).toBe(true);
  });

  test("an ordinary signed-in session cannot open the password reset form", async ({
    page,
  }) => {
    await page.goto("/reset-password");

    await expect(
      page.getByRole("heading", { name: "Enter your reset code" }),
    ).toBeVisible();
    await expect(page.getByLabel("6-digit code")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Choose a new password" }),
    ).toHaveCount(0);
  });

  test("the admin account does not show customer dashboard links", async ({
    page,
  }) => {
    await page.goto("/account");

    // The admin link comes after the customer links in the server-rendered
    // sidebar, so waiting for it confirms the whole link list has loaded.
    await expect(page.getByRole("link", { name: "Admin area" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Customer dashboard", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Become a provider", exact: true }),
    ).toHaveCount(0);
  });

  test("a signed-in customer cannot reach the admin area", async ({
    browser,
  }) => {
    const customerContext = await browser.newContext({
      storageState: customerState,
    });
    const customerPage = await customerContext.newPage();

    await customerPage.goto("/admin/providers");

    // The proxy rewrites the request, so the address bar keeps the admin
    // path while the page itself is the 403.
    await expect(
      customerPage.getByText("You cannot see this page."),
    ).toBeVisible();
    await expect(
      customerPage.getByText(/does not have access to this area/i),
    ).toBeVisible();

    await customerContext.close();
  });

  test("the admin can reorder the categories", async ({ page }) => {
    await page.goto("/admin/categories");

    const before = await adminClient()
      .from("service_categories")
      .select("id, sort_order")
      .order("sort_order");

    await page
      .getByRole("button", { name: /^Move .* down$/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/categories\?ok=/);

    const after = await adminClient()
      .from("service_categories")
      .select("id, sort_order")
      .order("sort_order");

    expect((after.data ?? []).map((row) => row.id)).not.toEqual(
      (before.data ?? []).map((row) => row.id),
    );
  });
});

test.describe("search", () => {
  // These cover the keyword boxes. Every query is either created by the test
  // or is a string that cannot exist, so nothing here depends on demo data.

  test("public search offers a keyword field and explains an empty match", async ({
    page,
  }) => {
    await page.goto("/search?service=furniture-repair&postcode=G12%208QQ");

    await expect(page.getByLabel("Provider name or keyword")).toBeVisible();
    await expect(page.getByText(/^\d+ approved provider/)).toBeVisible();

    await page
      .getByLabel("Provider name or keyword")
      .fill("zzzz-no-such-provider");
    await page.getByRole("button", { name: "Find local help" }).click();

    await expect(page).toHaveURL(/q=zzzz-no-such-provider/);
    await expect(
      page.getByText("No providers match that keyword"),
    ).toBeVisible();
  });

  test.describe("the customer dashboard", () => {
    test.use({ storageState: customerState });

    test("a customer can search their own jobs and clear the search", async ({
      page,
    }) => {
      const title = unique("Searchable chair");
      await postJob(page, {
        category: CATEGORY.furniture,
        title,
        description: "A dining chair with a loose leg that needs re-gluing.",
        postcode: "G12 8QQ",
      });

      await page.goto("/jobs");
      await page
        .getByLabel("Search your jobs by title, service or postcode")
        .fill(title);
      await page.getByRole("button", { name: "Search" }).click();

      await expect(page).toHaveURL(/\/jobs\?q=/);
      await expect(page.getByText(/^1 job for/)).toBeVisible();
      await expect(page.getByText(title).first()).toBeVisible();

      await page.getByRole("link", { name: "Clear search" }).click();
      await expect(page).toHaveURL(/\/jobs$/);
      await expect(page.getByText(/^0 jobs for/)).toHaveCount(0);

      await page.goto("/jobs?q=zzzz-no-such-job");
      await expect(page.getByText("No jobs match your search")).toBeVisible();
    });
  });

  test.describe("the provider dashboard", () => {
    test.use({ storageState: providerState });

    test("a provider can search matching jobs and their offers", async ({
      page,
    }) => {
      await page.goto("/provide/jobs?q=zzzz-no-such-job");
      await expect(page.getByText("No jobs match your search")).toBeVisible();

      await page.goto("/provide/offers?q=zzzz-no-such-offer");
      await expect(
        page.getByText("No offers match your search"),
      ).toBeVisible();
    });
  });

  test.describe("the admin dashboard", () => {
    test.use({ storageState: adminState });

    test("an admin can search users and providers", async ({ page }) => {
      await page.goto(`/admin/users?q=${encodeURIComponent(ACCOUNTS.admin)}`);
      await expect(page.getByText(/^1 user for/)).toBeVisible();
      await expect(
        page.locator("article").first().getByText(ACCOUNTS.admin),
      ).toBeVisible();

      await page.goto("/admin/users?q=zzzz-no-such-user");
      await expect(page.getByText("No users match “zzzz-no-such-user”.")).toBeVisible();

      await page.goto("/admin/providers?q=zzzz-no-such-provider");
      await expect(
        page.getByText("No providers match “zzzz-no-such-provider”."),
      ).toBeVisible();
    });
  });
});

test.describe("profiles and posting a job", () => {
  test.describe("a customer without a provider profile", () => {
    test.use({ storageState: customerState });

    test("sees how to become a provider and posts a job in the dashboard", async ({
      page,
    }) => {
      await page.goto("/jobs");

      const dashboardNav = page.getByRole("navigation", {
        name: "Dashboard",
        exact: true,
      });
      await expect(dashboardNav).toBeVisible();
      await expect(
        dashboardNav.getByRole("link", { name: "Become a provider" }),
      ).toBeVisible();

      await page.goto("/post-job");

      // Posting a job is part of the customer dashboard now, not the landing
      // site. The dashboard navigation and the shared form are both present.
      await expect(
        page.getByRole("navigation", { name: "Dashboard", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".l-header")).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Post a job" }),
      ).toBeVisible();
      await expect(page.getByLabel("What do you need?")).toBeVisible();
      await expect(page.getByLabel("Job title")).toBeVisible();
    });
  });

  test.describe("a provider who can also hire", () => {
    test.use({ storageState: providerState });

    test("switches between the customer and provider dashboards", async ({
      page,
    }) => {
      await page.goto("/provide");

      const switcher = page.getByRole("group", { name: "Switch profile" });
      await expect(switcher).toBeVisible();

      await switcher
        .getByRole("link", { name: "Switch to customer dashboard" })
        .click();
      await expect(page).toHaveURL(/\/jobs$/);
      await expect(
        page.getByRole("heading", { name: "My jobs" }),
      ).toBeVisible();

      await page
        .getByRole("group", { name: "Switch profile" })
        .getByRole("link", { name: "Switch to provider dashboard" })
        .click();
      await expect(page).toHaveURL(/\/provide$/);
      await expect(
        page.getByRole("heading", { name: "Petra Mends" }),
      ).toBeVisible();
    });
  });
});
