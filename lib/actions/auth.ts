"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { fail, ok, fromZodError, errorMessage } from "@/lib/actions/result";
import type { ActionResult } from "@/lib/actions/result";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resetRequestSchema,
} from "@/lib/schemas/auth";
import { landingPath, safeNextPath } from "@/lib/next-path";
import { getAccountState } from "@/lib/auth-admin";

export async function registerUser(
  _previous: ActionResult<{ next: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ next: string }>> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    acceptedTerms: formData.get("acceptedTerms") === "on",
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const { email, password, fullName } = parsed.data;
  const limit = checkRateLimit(`register:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return fail(
      "RATE_LIMITED",
      "Too many attempts. Wait a few minutes and try again.",
    );
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          accepted_terms_at: new Date().toISOString(),
        },
        emailRedirectTo: `${getPublicEnv().siteUrl}/auth/callback?next=/account`,
      },
    });

    if (error) {
      if (/already registered/i.test(error.message)) {
        return fail(
          "EMAIL_IN_USE",
          "An account already uses that email. Sign in instead.",
          { email: "An account already uses that email." },
        );
      }
      return fail("SIGN_UP_FAILED", "We couldn't create your account. Check your details and try again.");
    }

    // The person is sent to sign in, then carried on to where they were
    // heading before they were asked to register.
    const next = safeNextPath(formData.get("next")?.toString(), "/account");
    return ok({
      next: `/login?registered=1&next=${encodeURIComponent(next)}`,
    });
  } catch (error) {
    return fail("SIGN_UP_FAILED", errorMessage(error, "We couldn't create your account."));
  }
}

export async function signIn(
  _previous: ActionResult<{ next: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ next: string }>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const limit = checkRateLimit(
    `login:${parsed.data.email.toLowerCase()}`,
    8,
    15 * 60 * 1000,
  );
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Too many sign-in attempts. Wait a few minutes and try again.");
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      if (/not confirmed/i.test(error.message)) {
        return fail(
          "EMAIL_NOT_CONFIRMED",
          "Confirm your email address first. Check your inbox for the link we sent.",
        );
      }
      return fail("SIGN_IN_FAILED", "Email or password is incorrect.");
    }

    // The landing page depends on the role, so it is resolved here rather than
    // in the browser. An admin is sent to the admin dashboard, never to the
    // provider dashboard, whatever page asked them to sign in.
    const account = await getAccountState(data.user.id);

    return ok({
      next: landingPath({
        role: account.role,
        isProvider: account.isProvider,
        requested: formData.get("next")?.toString(),
      }),
    });
  } catch (error) {
    return fail("SIGN_IN_FAILED", errorMessage(error, "We couldn't sign you in."));
  }
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fromZodError(parsed.error);

  const limit = checkRateLimit(
    `reset:${parsed.data.email.toLowerCase()}`,
    5,
    15 * 60 * 1000,
  );
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Too many requests. Wait a few minutes and try again.");
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${getPublicEnv().siteUrl}/auth/callback?next=/reset-password`,
      },
    );

    // The visitor is not told whether the address exists, but a genuine
    // failure is still logged so it can be chased.
    if (error) {
      console.error("Password reset request failed", error.message);
    }
  } catch (error) {
    // Do not reveal whether the address exists.
    console.error("Password reset request failed", errorMessage(error, "unknown"));
  }

  return ok(undefined);
}

export async function resetPassword(
  _previous: ActionResult<{ next: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ next: string }>> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      return fail(
        "RESET_FAILED",
        "That reset link has expired. Request a new link and try again.",
      );
    }

    return ok({ next: "/account?password=updated" });
  } catch (error) {
    return fail("RESET_FAILED", errorMessage(error, "We couldn't update your password."));
  }
}
