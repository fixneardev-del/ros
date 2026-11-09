import { defineConfig, devices } from "@playwright/test";

/**
 * Next.js only allows one dev server per project directory, so the tests use
 * the same port as `npm run dev` and reuse it when it is already running.
 */
const PORT = Number(process.env.E2E_PORT || 3001);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Playwright ships its own Chromium. Some machines cannot install it, so an
 * existing Chromium can be pointed at with this variable.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
