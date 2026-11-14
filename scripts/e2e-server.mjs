/**
 * Starts the app for the end-to-end suite.
 *
 * The suite runs against a production build, because that is what people use.
 * The development server renders the error pages differently, and a test that
 * passes there can still fail in production.
 *
 * The build goes into its own directory, so a test run never overwrites the
 * build a development server is using. The signed-in tests need a real
 * database, so the local Supabase stack is started first and its keys are
 * passed to Next.js as environment variables. Real environment variables take
 * precedence over `.env` files, so the app talks to the local stack whether
 * or not a `.env.local` exists.
 *
 * Playwright runs this as its web server. It is also usable on its own:
 *
 *   node scripts/e2e-server.mjs --port 3005
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "local-supabase.sh");
const distDir = ".next-e2e";

const portArg = process.argv.indexOf("--port");
const port = portArg > -1 ? process.argv[portArg + 1] : "3005";

/**
 * The keys come from the stack script, unless the environment already has
 * them. A hosted project can be used instead by setting the variables before
 * the run, which is how the suite is pointed at staging.
 */
function readStackEnv() {
  const fromEnvironment = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  };

  if (fromEnvironment.NEXT_PUBLIC_SUPABASE_URL) return fromEnvironment;

  const result = spawnSync(script, ["env"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `Could not read the local stack keys.\n${result.stderr ?? ""}`.trim(),
    );
  }

  const parsed = {};
  for (const line of result.stdout.split("\n")) {
    const index = line.indexOf("=");
    if (index > 0) parsed[line.slice(0, index)] = line.slice(index + 1);
  }

  return parsed;
}

function ensureStack() {
  const result = spawnSync(script, ["ensure"], { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(
      "The local Supabase stack could not start. Run scripts/local-supabase.sh start and try again.",
    );
  }
}

/**
 * The demo data gives the signed-in tests providers, jobs and an offer to
 * work with. It is idempotent, so loading it on every run is safe.
 */
function loadDemoData() {
  const demoData = path.join(root, "scripts", "local-demo-data.sh");
  const result = spawnSync(demoData, [], { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("The demo data could not be loaded.");
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  ensureStack();
  loadDemoData();
}

const stackEnv = readStackEnv();
const env = {
  ...process.env,
  ...stackEnv,
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ?? `http://127.0.0.1:${port}`,
  // The tests read the environment file themselves.
  E2E_SUPABASE_URL: stackEnv.NEXT_PUBLIC_SUPABASE_URL,
  E2E_SUPABASE_SECRET_KEY: stackEnv.SUPABASE_SECRET_KEY,
};

if (!existsSync(path.join(root, "node_modules", "next"))) {
  throw new Error("The dependencies are not installed. Run npm install first.");
}

// The build is skipped when the caller says so, which keeps a test-only
// change quick to run.
if (process.env.E2E_SKIP_BUILD !== "1") {
  const build = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "build"],
    { cwd: root, env: { ...env, NEXT_DIST_DIR: distDir }, stdio: "inherit" },
  );
  if (build.status !== 0) {
    throw new Error("The production build failed.");
  }
}

const child = spawn(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "start", "--", "--port", port],
  {
    cwd: root,
    env: { ...env, NEXT_DIST_DIR: distDir },
    stdio: "inherit",
  },
);

const stop = () => child.kill("SIGTERM");
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", (code) => process.exit(code ?? 0));
