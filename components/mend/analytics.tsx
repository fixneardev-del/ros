"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { AnalyticsEvent } from "@/lib/analytics";

const TOKEN_KEY = "ras_analytics_token";
const ENABLED_KEY = "ras_analytics_enabled";

function getToken() {
  try {
    const existing = window.localStorage.getItem(TOKEN_KEY);
    if (existing) return existing;

    const token = crypto.randomUUID();
    window.localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    return "anonymous";
  }
}

/**
 * Analytics are off by default. The browser asks once per session whether
 * they are switched on, so a site with analytics disabled sends nothing.
 */
async function analyticsEnabled() {
  try {
    const cached = window.sessionStorage.getItem(ENABLED_KEY);
    if (cached !== null) return cached === "1";

    const response = await fetch("/api/analytics", { method: "GET" });
    const data = (await response.json()) as { enabled?: boolean };
    const enabled = Boolean(data.enabled);
    window.sessionStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Sends an event to the first party collector. Failures are ignored on
 * purpose. Analytics must never break a page.
 */
export async function trackEvent(
  event: AnalyticsEvent,
  props: Record<string, string | number | boolean> = {},
) {
  if (typeof window === "undefined") return;
  if (!(await analyticsEnabled())) return;

  const path = `${window.location.pathname}${window.location.search}`;

  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-analytics-token": getToken(),
      },
      body: JSON.stringify({ event, path, props }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Ignore. Analytics never blocks the page.
  }
}

/**
 * Records a page view when the route changes. It also records a search when
 * the route carries a service and a postcode.
 */
export function AnalyticsPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const service = searchParams.get("service");
    const postcode = searchParams.get("postcode");

    if (service && postcode) {
      trackEvent("search", { service, district: postcode.slice(0, 4) });
      return;
    }

    trackEvent("page_view");
  }, [pathname, searchParams]);

  return null;
}
