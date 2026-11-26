import { expect, test } from "@playwright/test";

test("the contact page sends a message and confirms it", async ({ page }) => {
  await page.goto("/");

  const footerLink = page.getByRole("contentinfo").getByRole("link", { name: "Contact us" });
  await expect(footerLink).toBeVisible();
  await footerLink.click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { name: "Contact us" })).toBeVisible();

  await page.locator("#contact-name").fill("Nina Patel");
  await page.locator("#contact-email").fill("nina.contact@example.com");
  await page.locator("#contact-subject").fill("Question about provider applications");
  await page.locator("#contact-message").fill(
    "Hello, I would like to know how long the admin review takes. Thank you.",
  );
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(
    page.getByText("Thanks. We have your message and will reply by email."),
  ).toBeVisible();
});
