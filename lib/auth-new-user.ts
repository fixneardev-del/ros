interface SignInTimestamps {
  created_at?: string | null;
  last_sign_in_at?: string | null;
}

const NEW_ACCOUNT_WINDOW_MS = 15 * 60 * 1000;
const FIRST_SIGN_IN_WINDOW_MS = 2 * 1000;

/**
 * GoTrue sets `created_at` when an account is created and advances
 * `last_sign_in_at` on each login. A first login therefore has both timestamps
 * close together and the account itself is recent. This is a heuristic: an
 * exact marker would need a database column, which is unnecessary for the
 * pilot. A wider creation window tolerates clock skew.
 */
export function isFirstTimeSignIn(
  user: SignInTimestamps,
  now: number = Date.now(),
) {
  if (!user.created_at) return false;

  const created = Date.parse(user.created_at);
  if (!Number.isFinite(created)) return false;

  const age = now - created;
  if (age < 0 || age > NEW_ACCOUNT_WINDOW_MS) return false;

  if (!user.last_sign_in_at) return true;

  const lastSignIn = Date.parse(user.last_sign_in_at);
  if (!Number.isFinite(lastSignIn)) return true;

  return Math.abs(lastSignIn - created) <= FIRST_SIGN_IN_WINDOW_MS;
}
