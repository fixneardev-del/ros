import { cache } from "react";
import { forbidden, redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Profile, ProviderProfile } from "@/lib/types";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>;

/**
 * The session is read once per request. The layout and the page both need it,
 * and React's cache keeps that to a single round trip.
 *
 * `connection()` stops the prerender here. The auth client checks the session
 * expiry against the current time, and a value that changes between renders
 * cannot be baked into a static shell.
 */
export const getSessionContext = cache(async () => {
  await connection();

  const supabase = isSupabaseConfigured()
    ? await createServerSupabase()
    : (null as unknown as ServerSupabase);

  if (!isSupabaseConfigured()) {
    return { supabase, user: null, profile: null, providerProfile: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null, providerProfile: null };
  }

  const [{ data: profile }, { data: providerProfile }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("provider_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return {
    supabase,
    user,
    profile: (profile as Profile | null) ?? null,
    providerProfile: (providerProfile as ProviderProfile | null) ?? null,
  };
});

export async function requireUser(next = "/") {
  const context = await getSessionContext();

  if (!context.user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (context.profile?.is_suspended) {
    redirect("/account?error=suspended");
  }

  return {
    ...context,
    user: context.user,
    profile: context.profile as Profile,
  };
}

export async function requireAdmin() {
  const context = await requireUser("/admin");

  // A signed-in non-admin gets a real 403 on every admin route. An anonymous
  // visitor is sent to sign in first.
  if (context.profile.role !== "admin") {
    forbidden();
  }

  return context;
}

export async function requireProvider() {
  const context = await requireUser("/provide");

  if (!context.providerProfile) {
    // An admin who does not offer services has no provider dashboard. The
    // application form is not a sensible place to send them either.
    if (context.profile.role === "admin") {
      redirect("/admin");
    }
    redirect("/provide/apply");
  }

  return { ...context, providerProfile: context.providerProfile as ProviderProfile };
}

export async function requireApprovedProvider() {
  const context = await requireProvider();

  if (context.providerProfile.status !== "approved") {
    redirect("/provide?error=not-approved");
  }

  return context;
}
