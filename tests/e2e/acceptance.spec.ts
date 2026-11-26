import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, DEMO_PASSWORD, adminClient, rowsFor } from "./helpers";

/**
 * The ten checks in the client acceptance matrix, automated against the local
 * stack. T03 to T09 form one journey: the provider created in T03 is approved
 * in T05 and removed in T09, and the job posted in T06 carries the offer in
 * T07 and T08. `serial` keeps that journey in order while each test still
 * asserts its own visible outcome and its own database row.
 */
const customerState = "tests/e2e/.auth/customer.json";
const providerState = "tests/e2e/.auth/provider.json";
const adminState = "tests/e2e/.auth/admin.json";

const run = `${Date.now()}`;
const providerEmail = `qa.acceptance.provider.${run}@example.com`;
const waitlistEmail = `qa.acceptance.waitlist.${run}@example.com`;
const displayName = `QA Acceptance ${run}`;
const jobTitle = `Acceptance chair repair ${run}`;

// A minimal PNG. The application checks the magic bytes, not the dimensions.
const PHOTO = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

let providerUserId: string;
let jobId: string;
let offerId: string;

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("acceptance matrix", () => {
  test.describe.configure({ mode: "serial" });

  test.afterAll(async () => {
    const client = adminClient();

    if (offerId) {
      await client.from("provider_offers").delete().eq("id", offerId);
    }
    if (jobId) {
      await client.from("job_requests").delete().eq("id", jobId);
    }
    if (providerUserId) {
      await client
        .from("provider_photos")
        .delete()
        .eq("provider_id", providerUserId);
      await client
        .from("provider_services")
        .delete()
        .eq("provider_id", providerUserId);
      await client
        .from("provider_profiles")
        .delete()
        .eq("user_id", providerUserId);
      await client.auth.admin.deleteUser(providerUserId);
    }
    await client.from("interest_signups").delete().eq("email", waitlistEmail);
  });

  test("T01 customer searches for a service and sees an approved provider", async ({
    page,
  }) => {
    await page.goto("/search?service=furniture-repair&postcode=G12%208QQ");

    await expect(
      page.getByRole("heading", {
        name: "Furniture repair and refurbishment in G12",
      }),
    ).toBeVisible();
    await expect(page.getByText(/^\d+ approved providers?/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Petra Mends" })).toBeVisible();
  });

  test("T02 customer enters a pilot postcode and an unsupported postcode", async ({
    page,
  }) => {
    await page.goto("/search?service=furniture-repair&postcode=G12%208QQ");
    await expect(page.getByText("G12 pilot area")).toBeVisible();

    await page.goto("/search?service=furniture-repair&postcode=M1%201AE");
    await expect(page.getByText(/We are not in M1 yet/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Join the waitlist" })).toBeVisible();
  });

  test("T03 provider registers and the application is stored", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Your name").fill("QA Acceptance");
    await page.getByLabel("Email").fill(providerEmail);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/login\?registered=1/);

    await signIn(page, providerEmail);
    await expect(page).toHaveURL(/\/jobs$/);

    await page.goto("/provide/apply");
    await page.getByLabel("I am a").selectOption("individual");
    await page.getByLabel("Name customers will see").fill(displayName);
    await page
      .getByLabel("About your work")
      .fill("I repair and refinish wooden furniture carefully and reliably.");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel("Furniture repair and refurbishment").check();
    await page.getByLabel(/^G12 —/).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await page
      .locator('input[type="file"][name="photos"]')
      .setInputFiles({ name: "work.png", mimeType: "image/png", buffer: PHOTO });
    await page.getByRole("button", { name: "Continue" }).click();

    await page
      .getByLabel(/I confirm this application is accurate/)
      .check();
    await page.getByRole("button", { name: "Send application" }).click();

    await expect(page).toHaveURL(/\/account\?applied=1/);
    await expect(page.getByText("Provider application submitted")).toBeVisible();
    await expect(
      page.getByText("Provider application: pending"),
    ).toBeVisible();

    const profiles = await rowsFor("provider_profiles", "display_name", displayName);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].status).toBe("pending");
    providerUserId = profiles[0].user_id;

    const photos = await rowsFor("provider_photos", "provider_id", providerUserId);
    expect(photos).toHaveLength(1);
    expect(photos[0].storage_path).toMatch(/^[^/]+\/[^/]+\.png$/);
  });

  test("T04 provider photographs are stored and appear on the profile", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, providerEmail);

    const photos = await rowsFor("provider_photos", "provider_id", providerUserId);
    const storagePath = photos[0].storage_path as string;
    const supabaseUrl =
      process.env.E2E_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      "http://127.0.0.1:54321";
    const imageResponse = await page.request.get(
      `${supabaseUrl}/storage/v1/object/public/provider-photos/${storagePath}`,
    );

    expect(imageResponse.status()).toBe(200);
    expect(imageResponse.headers()["content-type"]).toContain("image/png");

    await page.goto(`/providers/${providerUserId}`);
    await expect(
      page.getByRole("img", { name: `Work by ${displayName}` }).first(),
    ).toBeVisible();

    await context.close();
  });

  test("T05 administrator approves a provider and search finds them", async ({
    page,
  }) => {
    await page.goto(`/admin/providers/${providerUserId}`);
    await page.getByRole("button", { name: "Approve provider" }).click();
    await expect(page).toHaveURL(/\/admin\/providers\?ok=/);

    const profiles = await rowsFor("provider_profiles", "user_id", providerUserId);
    expect(profiles[0].status).toBe("approved");

    await page.goto("/search?service=furniture-repair&postcode=G12%208QQ");
    await expect(page.getByRole("heading", { name: displayName })).toBeVisible();
  });

  test("T05b an approved provider switches dashboards from the account menu", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await signIn(page, providerEmail);
    await expect(page).toHaveURL(/\/provide$/);

    await page.goto("/account");
    await expect(
      page.getByText("Provider application: approved"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Switch to Find help" }).click();
    await expect(page).toHaveURL(/\/search$/);

    await page.goto("/account");
    await page.getByRole("button", { name: "Switch to Provide services" }).click();
    await expect(page).toHaveURL(/\/provide$/);

    const { data: profile, error } = await adminClient()
      .from("profiles")
      .select("active_dashboard")
      .eq("id", providerUserId)
      .single();
    expect(error).toBeNull();
    expect(profile?.active_dashboard).toBe("provider");

    await context.close();
  });

  test.use({ storageState: adminState });

  test("T06 customer submits a job and the administrator sees it", async ({
    page,
    browser,
  }) => {
    const customerContext = await browser.newContext({
      storageState: customerState,
    });
    const customerPage = await customerContext.newPage();

    await customerPage.goto("/post-job");
    await customerPage
      .getByLabel("What do you need?")
      .selectOption({ label: "Furniture repair and refurbishment" });
    await customerPage.getByLabel("Job title").fill(jobTitle);
    await customerPage
      .getByLabel("Describe the job")
      .fill("A dining chair with a loose leg that needs re-gluing.");
    await customerPage.getByLabel("Postcode").fill("G12 8QQ");
    await customerPage.getByRole("button", { name: "Post job" }).click();

    await expect(customerPage).toHaveURL(/\/jobs\/[0-9a-f-]+\?created=1/);
    jobId = new URL(customerPage.url()).pathname.split("/").pop()!;
    await expect(customerPage.getByText("Job request")).toBeVisible();
    await expect(customerPage.getByText("0 offers")).toBeVisible();
    await customerContext.close();

    const jobs = await rowsFor("job_requests", "id", jobId);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].postcode_district).toBe("G12");
    expect(jobs[0].status).toBe("open");

    await page.goto("/admin/jobs");
    await expect(page.getByRole("link", { name: jobTitle })).toBeVisible();
  });

  test("T07 provider submits an offer against the correct job", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: providerState });
    const page = await context.newPage();

    await page.goto(`/provide/jobs?q=${encodeURIComponent(jobTitle)}`);
    await page.getByRole("link", { name: jobTitle }).click();
    await page
      .getByLabel("Your message")
      .fill("I can re-glue the chair and test it this weekend.");
    await page.getByLabel("Indicative price in pounds").fill("45");
    await page.getByLabel("When could you do it?").fill("This weekend");
    await page.getByRole("button", { name: "Send offer" }).click();

    await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}\\?offer=sent`));
    await context.close();

    const offers = await rowsFor("provider_offers", "job_id", jobId);
    expect(offers).toHaveLength(1);
    expect(offers[0].indicative_price_pence).toBe(4500);
    expect(offers[0].estimated_timeframe).toBe("This weekend");
    expect(offers[0].status).toBe("submitted");
    offerId = offers[0].id;

    const demoProvider = await rowsFor(
      "provider_profiles",
      "display_name",
      "Petra Mends",
    );
    expect(offers[0].provider_id).toBe(demoProvider[0].user_id);
  });

  test("T08 customer views the offer with contact details private", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: customerState });
    const page = await context.newPage();

    await page.goto(`/jobs/${jobId}`);
    await expect(page.getByText("1 offer")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Petra Mends" })).toBeVisible();
    await expect(page.getByText("£45")).toBeVisible();
    await expect(page.getByText("This weekend", { exact: true })).toBeVisible();
    await expect(
      page.getByText("I can re-glue the chair and test it this weekend."),
    ).toBeVisible();
    await expect(page.getByText(ACCOUNTS.provider, { exact: true })).toHaveCount(0);

    await context.close();
  });

  test("T09 administrator removes a listing from public search", async ({
    page,
  }) => {
    await page.goto(`/admin/providers/${providerUserId}`);
    await page.locator("#remove-reason").fill("QA acceptance removal check.");
    await page.getByRole("button", { name: "Remove provider" }).click();
    await expect(page).toHaveURL(/\/admin\/providers\?ok=/);
    await expect(page.getByText(/Provider removed/)).toBeVisible();

    const profiles = await rowsFor("provider_profiles", "user_id", providerUserId);
    expect(profiles).toHaveLength(0);

    const response = await page.goto(`/providers/${providerUserId}`);
    // Partial Prerender streams notFound() inside a 200 document shell.
    expect([200, 404]).toContain(response?.status());
    await expect(
      page.getByRole("heading", { name: "We couldn't find that page." }),
    ).toBeVisible();

    await page.goto("/search?service=furniture-repair&postcode=G12%208QQ");
    await expect(page.getByRole("heading", { name: displayName })).toHaveCount(0);
  });

  test("T10 customer submits a form and sees confirmation", async ({ page }) => {
    await page.goto("/search?service=furniture-repair&postcode=M1%201AE");
    await page.getByLabel("Email").fill(waitlistEmail);
    await page.getByLabel("Postcode").fill("M1 1AE");
    await page.getByRole("button", { name: "Tell me when you arrive" }).click();

    await expect(
      page.getByText("Thanks. We will email you when we reach your area."),
    ).toBeVisible();

    const rows = await rowsFor("interest_signups", "email", waitlistEmail);
    expect(rows).toHaveLength(1);
    expect(rows[0].postcode).toBe("M1 1AE");
  });
});
