"use client";

import { useEffect } from "react";
import { hasAuthErrorFragment } from "@/lib/auth-url";

/**
 * Turns Supabase's raw `#error=...` fragment into the app's own ?error=auth
 * URL, so the page shows its friendly message instead of an SDK error string.
 */
export function AuthErrorCleaner() {
  useEffect(() => {
    if (!hasAuthErrorFragment(window.location.hash)) return;

    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.set("error", "auth");
    // A full navigation drops the fragment and lets the server render its
    // friendly error message. history.replaceState alone is not enough: the
    // App Router restores its own URL on the next render.
    window.location.replace(`${url.pathname}${url.search}`);
  }, []);

  return null;
}
