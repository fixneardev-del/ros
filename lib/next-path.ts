/**
 * Where to send a person after they sign in.
 *
 * Only same-site paths are allowed. `//example.com` is rejected because a
 * browser would read it as a protocol relative URL and leave the site.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback = "/account",
) {
  if (!value) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/\\")) return fallback;

  try {
    const base = new URL("https://same-origin.invalid");
    const resolved = new URL(value, base);
    if (resolved.origin !== base.origin) return fallback;
  } catch {
    return fallback;
  }

  return value;
}

export type AccountRole = "admin" | "user" | null;

/**
 * Where a signed-in person should land.
 *
 * The requested page is honoured when it suits the role. An admin never lands
 * on a provider-only page: signing in with an admin account must not drop
 * someone into the provider dashboard, whichever page sent them to sign in.
 */
export function landingPath(input: {
  role: AccountRole;
  isProvider: boolean;
  requested?: string | null;
}) {
  const requested = safeNextPath(input.requested, "");

  if (input.role === "admin") {
    if (!requested || requested.startsWith("/provide")) return "/admin";
    return requested;
  }

  if (requested) return requested;

  if (input.isProvider) return "/provide";
  return "/account";
}
