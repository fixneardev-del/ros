type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory limiter. It resets on deploy and is per instance, so it is a
 * first line of defence rather than a distributed guarantee.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number) {
  // The browser suite signs the same demo accounts in once per engine against
  // one server instance. A production throttle would fail the last engine for
  // reasons unrelated to the app.
  if (process.env.E2E_TEST === "1") {
    return { allowed: true, remaining: limit };
  }

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}
