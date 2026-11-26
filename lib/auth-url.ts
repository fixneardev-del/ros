/**
 * Supabase Auth reports OAuth failures twice: as query parameters and again
 * as a URL fragment. The fragment is never sent to the server, so the page has
 * to clean it up or the raw error stays in the address bar.
 */
export function hasAuthErrorFragment(hash: string) {
  if (!hash || hash === "#") return false;

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return (
    params.has("error") ||
    params.has("error_code") ||
    params.has("error_description")
  );
}
