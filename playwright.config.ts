import { defineConfig, devices } from "@playwright/test";

/**
 * The end-to-end suite runs against a production build on its own port, so
 * it never collides with a development server and never overwrites the build
 * that server is using.
 */
const PORT = Number(process.env.E2E_PORT || 3005);
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
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // Signs each role in once and saves the session for the tests below.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
      dependencies: ["setup"],
    },
    ...(allBrowsers
      ? [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
            dependencies: ["setup"],
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
            dependencies: ["setup"],
          },
        ]
      : []),
  ],
  webServer: {
    // The server script starts the local Supabase stack, builds the app and
    // hands its keys to Next.js, so the signed-in tests always have a real
    // database and the app behaves exactly as it will in production.
    command: `node scripts/e2e-server.mjs --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
