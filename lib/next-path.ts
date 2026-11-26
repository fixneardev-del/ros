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
export type ActiveDashboard = "customer" | "provider";

/**
 * Where a signed-in person lands.
 *
 * Sign-in opens the dashboard for the account's role: `/admin` for admins,
 * `/provide` for approved providers and `/jobs` for customers. `/account` is
 * settings, not a dashboard. A provider who switched to the customer dashboard
 * lands there until they switch back.
 */
export function landingPath(input: {
  role: AccountRole;
  isProvider: boolean;
  activeDashboard?: ActiveDashboard;
}) {
  if (input.role === "admin") return "/admin";
  if (input.isProvider && input.activeDashboard === "provider") {
    return "/provide";
  }
  return "/jobs";
}
