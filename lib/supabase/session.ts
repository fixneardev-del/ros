import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { readActiveDashboard } from "@/lib/supabase/active-dashboard";

const PROTECTED_PREFIXES = [
  "/post-job",
  "/jobs",
  "/account",
  "/provide",
  "/admin",
];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

// /provide/apply is the public onboarding page reached from the site header.
// It is not part of the provider dashboard.
function isProviderOnlyPath(pathname: string) {
  return (
    pathname === "/provide" ||
    (pathname.startsWith("/provide/") && pathname !== "/provide/apply")
  );
}

// A job detail page is shared: its owner, an admin and a provider with a
// claim on it all need to open it. The job list and posting are customer only.
function isCustomerOnlyPath(pathname: string) {
  return pathname === "/jobs" || pathname.startsWith("/post-job");
}

type DashboardRole = "admin" | "provider" | "customer";

function homeFor(role: DashboardRole) {
  if (role === "admin") return "/admin";
  if (role === "provider") return "/provide";
  return "/account";
}

/**
 * Copies the session cookies onto a response that replaces the original one,
 * so a refreshed session is not lost by a redirect or a rewrite.
 */
function withCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

/** The sign in page, with the page the visitor was trying to reach. */
function loginUrl(request: NextRequest) {
  const url = request.nextUrl.clone();
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", next);
  return url;
}

export async function updateSession(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const pathname = request.nextUrl.pathname;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Without Supabase nobody can be signed in, so protected paths send the
    // visitor to sign in rather than rendering an empty account.
    if (isProtected(pathname)) {
      return NextResponse.redirect(loginUrl(request));
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected(pathname)) {
    return withCookies(response, NextResponse.redirect(loginUrl(request)));
  }

  // Role checks run here, before anything renders. A redirect from a Suspense
  // boundary arrives after the dashboard shell has already streamed, and is
  // why the wrong dashboard flashed into view.
  if (user && isProtected(pathname)) {
    // Read `role` on its own so the absent `active_dashboard` column cannot
    // turn an admin into a customer while the hosted migration is pending.
    const [{ data: profile }, { data: providerProfile }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("provider_profiles")
        .select("user_id, status")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const isApprovedProvider = providerProfile?.status === "approved";
    let role: DashboardRole = profile?.role === "admin" ? "admin" : "customer";

    if (role === "customer" && isApprovedProvider) {
      const savedDashboard = await readActiveDashboard(supabase, user.id);
      if (savedDashboard === "provider") role = "provider";
    }

    if (isAdminPath(pathname) && role !== "admin") {
      const denied = NextResponse.rewrite(new URL("/admin-denied", request.url));
      return withCookies(response, denied);
    }

    if (
      (isProviderOnlyPath(pathname) && role !== "provider") ||
      (isCustomerOnlyPath(pathname) && role !== "customer")
    ) {
      const home = NextResponse.redirect(new URL(homeFor(role), request.url));
      return withCookies(response, home);
    }
  }

  return response;
}
