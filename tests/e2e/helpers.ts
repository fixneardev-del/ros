import { spawnSync } from "node:child_process";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Playwright runs from the project root.
const root = process.cwd();

export const DEMO_PASSWORD = "password123";

export const ACCOUNTS = {
  admin: "admin@example.com",
  customer: "customer@example.com",
  provider: "provider@example.com",
  pending: "pending@example.com",
} as const;

export type AccountKey = keyof typeof ACCOUNTS;

/**
 * The stack keys. The web server exports them, and the local stack script can
 * print them, so the tests work whether they run locally or in CI.
 */
function stackEnv() {
  const fromEnvironment = {
    url: process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.E2E_SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SECRET_KEY,
  };

  if (fromEnvironment.url && fromEnvironment.key) return fromEnvironment;

  const result = spawnSync(
    path.join(root, "scripts", "local-supabase.sh"),
    ["env"],
    { encoding: "utf8" },
  );

  const parsed: Record<string, string> = {};
  for (const line of (result.stdout ?? "").split("\n")) {
    const index = line.indexOf("=");
    if (index > 0) parsed[line.slice(0, index)] = line.slice(index + 1);
  }

  return {
    url: fromEnvironment.url ?? parsed.NEXT_PUBLIC_SUPABASE_URL,
    key: fromEnvironment.key ?? parsed.SUPABASE_SECRET_KEY,
  };
}

let client: SupabaseClient | null = null;

/**
 * A server-side client, used to read the rows a user action is supposed to
 * have written. RLS is bypassed, so the tests see the truth.
 */
export function adminClient() {
  if (client) return client;

  const { url, key } = stackEnv();
  if (!url || !key) {
    throw new Error(
      "The Supabase keys are missing. Start the local stack with scripts/local-supabase.sh start.",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

export async function countRows(table: string) {
  const { count, error } = await adminClient()
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`Could not count ${table}: ${error.message}`);
  return count ?? 0;
}

export async function rowsFor(table: string, column: string, value: string) {
  const { data, error } = await adminClient()
    .from(table)
    .select("*")
    .eq(column, value);
  if (error) throw new Error(`Could not read ${table}: ${error.message}`);
  return data ?? [];
}
