#!/usr/bin/env node
// RLS suite runner.
//
// The suite is plain SQL because the rules live in Postgres, not in the app.
// It runs every file in one psql session inside a transaction and rolls back
// at the end, so the database is left untouched.
//
// It never skips. If the database is unreachable the command fails, because a
// skipped RLS suite would look like a passing one.
//
// Connection:
//   SUPABASE_DB_URL  full connection string
//   SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_NAME, SUPABASE_DB_PASSWORD
//                    individual parts (defaults match `supabase start`)

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const suiteDir = dirname(fileURLToPath(import.meta.url));

function connectionUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

  const host = process.env.SUPABASE_DB_HOST || "127.0.0.1";
  const port = process.env.SUPABASE_DB_PORT || "54322";
  const name = process.env.SUPABASE_DB_NAME || "postgres";
  const password = process.env.SUPABASE_DB_PASSWORD || "postgres";

  return `postgresql://${password}@${host}:${port}/${name}`;
}

function findPsql() {
  const candidates = [
    process.env.PSQL_BIN,
    "psql",
    "/opt/homebrew/bin/psql",
    "/usr/local/bin/psql",
    "/usr/bin/psql",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes("/") && !existsSync(candidate)) continue;

    const probe = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (probe.status === 0) return candidate;
  }

  return null;
}

const psql = findPsql();

if (!psql) {
  console.error(
    "RLS suite failed: psql was not found. Install the PostgreSQL client tools or set PSQL_BIN.",
  );
  process.exit(1);
}

const url = connectionUrl();

const reachability = spawnSync(
  psql,
  [url, "-v", "ON_ERROR_STOP=1", "-c", "select 1;"],
  { encoding: "utf8" },
);

if (reachability.status !== 0) {
  console.error(`RLS suite failed: cannot reach the database at ${url}`);
  console.error(reachability.stderr || reachability.stdout || "");
  console.error(
    "Start a local database first, for example:\n" +
      "  npx supabase start\n" +
      "  npx supabase db reset",
  );
  process.exit(1);
}

const files = readdirSync(suiteDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error("RLS suite failed: no SQL files found in tests/rls.");
  process.exit(1);
}

const args = [
  url,
  "-v",
  "ON_ERROR_STOP=1",
  "-q",
  ...files.flatMap((file) => ["-f", join(suiteDir, file)]),
  "-c",
  "ROLLBACK;",
];

const result = spawnSync(psql, args, { stdio: "inherit" });

if (result.error) {
  console.error(`RLS suite failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`RLS suite failed (psql exit code ${result.status}).`);
  process.exit(result.status ?? 1);
}

console.log(`RLS suite passed: ${files.length} files, ${files.join(", ")}`);
