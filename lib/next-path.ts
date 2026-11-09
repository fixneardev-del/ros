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
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/\\")) return fallback;
  return value;
}
