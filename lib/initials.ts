/**
 * Two-letter initials for the dashboard avatar and profile card. Falls back
 * to the first two characters of an email local part, then to "Y".
 */
export function initials(
  name?: string | null,
  email?: string | null,
): string {
  const source = name?.trim() || email?.split("@")[0] || "";

  if (!source) return "Y";

  const parts = source.split(/[\s._-]+/).filter(Boolean);

  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
