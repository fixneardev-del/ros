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

/**
 * Playwright 1.65 does not support Firefox or WebKit on macOS 13 ARM. CI runs
 * all three browsers; locally we default to Chromium and opt in with
 * E2E_ALL_BROWSERS=1 on a supported machine.
 */
const allBrowsers =
  Boolean(process.env.CI) || process.env.E2E_ALL_BROWSERS === "1";

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
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
    ...(allBrowsers
      ? [
          { name: "firefox", use: { ...devices["Desktop Firefox"] } },
          { name: "webkit", use: { ...devices["Desktop Safari"] } },
        ]
      : []),
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
