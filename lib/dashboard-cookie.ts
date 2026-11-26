import { cookies } from "next/headers";
import type { ActiveDashboard } from "@/lib/next-path";
import {
  ACTIVE_DASHBOARD_COOKIE,
  dashboardCookieValue,
  readDashboardCookie,
} from "@/lib/supabase/active-dashboard";

/**
 * The browser-side copy of the saved dashboard choice.
 *
 * The hosted database has not applied `0003_active_dashboard.sql` yet, so a
 * switch cannot be written to `profiles` there. The cookie keeps switching
 * working until the column exists; once it does, both stores agree because the
 * cookie is written on every switch.
 */
export async function readDashboardCookieForUser(
  userId: string,
): Promise<ActiveDashboard | null> {
  try {
    const jar = await cookies();
    return readDashboardCookie(jar.get(ACTIVE_DASHBOARD_COOKIE)?.value, userId);
  } catch {
    // A unit test or a build-time render has no request cookies.
    return null;
  }
}

export async function setDashboardCookie(
  userId: string,
  dashboard: ActiveDashboard,
) {
  const jar = await cookies();
  jar.set(ACTIVE_DASHBOARD_COOKIE, dashboardCookieValue(userId, dashboard), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
