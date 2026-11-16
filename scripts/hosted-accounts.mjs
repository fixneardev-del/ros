#!/usr/bin/env node
/**
 * Create or refresh the demo sign-in accounts on the hosted project.
 *
 * `hosted-setup.sh` does this with psql as part of applying the schema, but it
 * needs the database password. This script uses the Admin API instead, so it
 * works on a project whose schema is already in place and it can be run again
 * without touching the data.
 *
 * Usage:
 *   ALLOW_DEMO_ACCOUNTS=1 npm run hosted:accounts -- --yes
 *
 * It reads `NEXT_PUBLIC_SUPABASE_URL`, the publishable key and
 * `SUPABASE_SECRET_KEY` from `.env.local` first, then `.env`, matching
 * Next.js's environment-file precedence. It refuses to run against the local
 * stack.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = [path.join(root, ".env.local"), path.join(root, ".env")].find(
  (candidate) => existsSync(candidate),
);
const PASSWORD = "password123";

const accounts = [
  { email: "admin@example.com", name: "Admin Person", role: "admin" },
  { email: "customer@example.com", name: "Nina Customer" },
  { email: "provider@example.com", name: "Petra Provider" },
];

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function readEnv() {
  if (!envPath) {
    fail(`.env (or .env.local) is missing. Copy .env.example to .env first.`);
  }

  const env = {};
  for (const rawLine of readFileSync(envPath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equals = line.indexOf("=");
    if (equals === -1) continue;

    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = readEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey =
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publishableKey) {
  fail(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in .env or .env.local.",
  );
}

if (!url.startsWith("https://")) {
  fail(
    `This script is for the hosted project, but .env points at ${url}. ` +
      "Switch to the hosted URL first.",
  );
}

if (!secretKey) {
  fail(
    "SUPABASE_SECRET_KEY is empty.\n" +
      "Copy the secret key from Supabase → Project Settings → API Keys, " +
      "paste it into .env, then run this again.",
  );
}

if (
  process.env.ALLOW_DEMO_ACCOUNTS !== "1" ||
  !process.argv.includes("--yes")
) {
  fail(
    `This will create or reset the demo accounts on ${url}.\n` +
      "Set ALLOW_DEMO_ACCOUNTS=1 and re-run with " +
      '"npm run hosted:accounts -- --yes" to confirm.',
  );
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUser(email) {
  const wanted = email.toLowerCase();

  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === wanted,
    );
    if (match) return match;
    if (data.users.length < 200) return null;
  }

  throw new Error(`Could not page through the users to find ${email}.`);
}

console.log(`Preparing demo accounts on ${url}`);

const ids = new Map();

for (const account of accounts) {
  const existing = await findUser(account.email);

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(
      existing.id,
      {
        password: PASSWORD,
        email_confirm: true,
        // GoTrue writes an empty role unless it is set, and PostgREST then
        // rejects every query with `role "" does not exist`.
        role: "authenticated",
        user_metadata: { ...existing.user_metadata, full_name: account.name },
      },
    );
    if (error) fail(`${account.email}: ${error.message}`);
    ids.set(account.email, data.user.id);
    console.log(`  updated ${account.email}`);
    continue;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: PASSWORD,
    email_confirm: true,
    role: "authenticated",
    user_metadata: { full_name: account.name },
  });
  if (error) fail(`${account.email}: ${error.message}`);
  ids.set(account.email, data.user.id);
  console.log(`  created ${account.email}`);
}

// The migration's trigger creates the profile row. Admin is the only role the
// app must not let people choose for themselves.
const { error: roleError } = await admin
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", ids.get("admin@example.com"));
if (roleError) fail(`Setting the admin role failed: ${roleError.message}`);

// Sign in with the publishable key, the same way the browser does, so this
// also proves that hosted password auth and the profile read work.
for (const account of accounts) {
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: account.email,
    password: PASSWORD,
  });
  if (error) fail(`${account.email} could not sign in: ${error.message}`);

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .single();
  if (profileError) {
    fail(`${account.email} could not read its profile: ${profileError.message}`);
  }

  console.log(
    `  signed in ${account.email} as ${profile.role} (${profile.full_name})`,
  );
  await client.auth.signOut();
}

console.log(`\nDone. Every account uses the password ${PASSWORD}.`);
