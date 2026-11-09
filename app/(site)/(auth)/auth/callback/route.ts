import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/account";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : "/account";

  if (code && isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(new URL(next, url.origin));
      }
    } catch {
      // Fall through to the friendly login error.
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth", url.origin),
  );
}
