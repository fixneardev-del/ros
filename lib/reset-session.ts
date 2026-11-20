import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ros_reset";
const MAX_AGE_SECONDS = 10 * 60;

function sessionSecret() {
  return (
    process.env.RESET_SESSION_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "local-reset-session-secret")
  );
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * A short-lived proof that the visitor completed a recovery link or code.
 * Without this, any signed-in user could open /reset-password?email=their own
 * address and change the password without proving they owned the email.
 */
export async function grantResetSession(email: string) {
  const secret = sessionSecret();
  if (!secret) return false;

  const normalized = email.trim().toLowerCase();
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${normalized}.${expires}`;

  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${signature(payload, secret)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  return true;
}

export async function hasResetSession(email: string) {
  const secret = sessionSecret();
  if (!secret) return false;

  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return false;

  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [normalized, expiresRaw, suppliedSignature] = parts;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) {
    return false;
  }
  if (normalized !== email.trim().toLowerCase()) return false;

  const expected = signature(`${normalized}.${expiresRaw}`, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expected);

  return (
    supplied.length === expectedBuffer.length &&
    timingSafeEqual(supplied, expectedBuffer)
  );
}

export async function clearResetSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
