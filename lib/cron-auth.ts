import { timingSafeEqual } from "node:crypto";

function secureEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. The custom header
 * is kept so existing manual calls continue to work.
 */
export function isCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authorization = request.headers.get("authorization");
  if (authorization && secureEqual(authorization, `Bearer ${cronSecret}`)) {
    return true;
  }

  const legacySecret = request.headers.get("x-cron-secret");
  return Boolean(legacySecret && secureEqual(legacySecret, cronSecret));
}
