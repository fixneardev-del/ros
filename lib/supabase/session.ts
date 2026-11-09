import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";

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

  // A signed-in person without the admin role gets a real 403 on every admin
  // route. The check runs here, before anything renders, because a check
  // inside a Suspense boundary runs after the shell has streamed and the
  // response would be a 200.
  if (user && isAdminPath(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      const denied = NextResponse.rewrite(new URL("/admin-denied", request.url));
      return withCookies(response, denied);
    }
  }

  return response;
}
