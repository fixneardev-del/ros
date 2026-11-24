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
 * Where a signed-in person lands.
 *
 * Sign-in always opens the platform for the account's role. A requested page
 * never overrides it: a provider link cannot drop an admin into the provider
 * dashboard, and a customer link cannot bypass their own platform.
 */
export function landingPath(input: {
  role: AccountRole;
  isProvider: boolean;
}) {
  if (input.role === "admin") return "/admin";
  if (input.isProvider) return "/provide";
  return "/account";
}
