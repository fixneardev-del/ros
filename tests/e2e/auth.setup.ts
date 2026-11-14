import { test as setup, expect } from "@playwright/test";
import { ACCOUNTS, DEMO_PASSWORD } from "./helpers";

/**
 * Signs each role in once and saves the session.
 *
 * The tests reuse these sessions instead of signing in over and over, which
 * keeps them fast and stays well inside the sign-in rate limit. The tests
 * that check the sign-in rules itself start from an empty state.
 */
const roles = ["customer", "provider", "admin"] as const;

for (const role of roles) {
  setup(`sign in as the ${role}`, async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ACCOUNTS[role]);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));

    await expect(page).not.toHaveURL(/\/login/);
    await page.context().storageState({ path: `tests/e2e/.auth/${role}.json` });
  });
}
