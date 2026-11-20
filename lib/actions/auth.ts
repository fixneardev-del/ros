"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPublicEnv, getEmailConfig } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { fail, ok, fromZodError, errorMessage } from "@/lib/actions/result";
import type { ActionResult } from "@/lib/actions/result";
import {
  loginSchema,
  registerSchema,
  resetCodeSchema,
  resetPasswordSchema,
  resetRequestSchema,
} from "@/lib/schemas/auth";
import { landingPath, safeNextPath } from "@/lib/next-path";
import { getAccountState } from "@/lib/auth-admin";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildEmailMessages } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/emails/send";
import { emit } from "@/lib/events";
import {
  clearResetSession,
  grantResetSession,
  hasResetSession,
} from "@/lib/reset-session";

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

  let welcome: {
    email: string;
    name: string;
    needsConfirmation: boolean;
  } | null = null;

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signUp({
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

    // Supabase hides whether an address is already registered by returning a
    // user with no identities. Only a genuine new account gets a welcome
    // email, otherwise trying to register someone else's address would spam
    // them.
    if ((data.user?.identities?.length ?? 0) > 0 && data.user?.email) {
      welcome = {
        email: data.user.email,
        name: fullName,
        needsConfirmation: !data.session,
      };
    }
  } catch (error) {
    return fail("SIGN_UP_FAILED", errorMessage(error, "We couldn't create your account."));
  }

  if (welcome) {
    try {
      await emit("auth.welcome", welcome);
    } catch (error) {
      // The account exists; a welcome email failing must not undo that.
      console.error("Welcome email could not be queued", errorMessage(error, "unknown"));
    }
  }

  // The person is sent to sign in, then carried on to where they were
  // heading before they were asked to register.
  const next = safeNextPath(formData.get("next")?.toString(), "/account");
  redirect(`/login?registered=1&next=${encodeURIComponent(next)}`);
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

  let next: string;
  let signInNotice: {
    email: string;
    name: string;
    signedInAt: string;
  } | null = null;

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

    next = landingPath({
      role: account.role,
      isProvider: account.isProvider,
      requested: formData.get("next")?.toString(),
    });

    signInNotice = {
      email: data.user.email ?? parsed.data.email,
      name:
        typeof data.user.user_metadata?.full_name === "string"
          ? data.user.user_metadata.full_name
          : "",
      signedInAt: new Date().toISOString(),
    };
  } catch (error) {
    return fail("SIGN_IN_FAILED", errorMessage(error, "We couldn't sign you in."));
  }

  if (signInNotice) {
    try {
      await emit("auth.signed_in", signInNotice);
    } catch (error) {
      // A security notice must never block a successful sign in.
      console.error("Sign-in notice could not be queued", errorMessage(error, "unknown"));
    }
  }

  // The redirect happens on the server, so it does not depend on the browser
  // being ready to navigate. The client-side version raced with the refresh
  // that followed it and sometimes left people on the sign-in page.
  redirect(next);
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

  const email = parsed.data.email;
  const { siteUrl } = getPublicEnv();
  const emailConfig = getEmailConfig();
  const admin = createAdminSupabase();

  // Supabase always sends a reset email when Resend is unavailable or a
  // branded send fails. The visitor sees the same result in every case so an
  // unknown address cannot be distinguished from a failed send.
  const sendViaSupabase = async () => {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      });
      if (error) {
        console.error("Password reset request failed", error.message);
      }
    } catch (error) {
      console.error("Password reset request failed", errorMessage(error, "unknown"));
    }
  };

  if (!admin || !emailConfig.configured) {
    await sendViaSupabase();
    return ok(undefined);
  }

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (error || !data.properties?.hashed_token) {
      await sendViaSupabase();
      return ok(undefined);
    }

    const tokenHash = data.properties.hashed_token;
    const resetUrl = `${siteUrl}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=${encodeURIComponent("/reset-password")}`;
    const [message] = buildEmailMessages(
      "auth.password_reset",
      {
        email,
        name:
          typeof data.user?.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : "",
        resetUrl,
        code: data.properties.email_otp,
        expiresInMinutes: 60,
      },
      siteUrl,
    );

    if (!message) {
      await sendViaSupabase();
      return ok(undefined);
    }

    const task = async () => {
      const result = await sendEmail({
        ...message,
        idempotencyKey: `password-reset/${tokenHash}`,
      });

      if (!result.ok) {
        // A timeout can happen after Resend accepted the message. A second
        // token would then leave two valid reset links, so log and stop.
        console.error("Password reset email failed", result.error);
      } else if (result.skipped) {
        console.error("Password reset email skipped", result.reason);
        await sendViaSupabase();
      }
    };

    // The reset token must not be persisted, so it is sent directly rather
    // than written to the notification outbox. The response does not wait for
    // Resend.
    try {
      after(task);
    } catch {
      await task();
    }
  } catch (error) {
    // Do not reveal whether the address exists.
    console.error("Password reset request failed", errorMessage(error, "unknown"));
    await sendViaSupabase();
  }

  return ok(undefined);
}

/**
 * The second half of the reset flow. The email carries a six digit code as
 * well as a link, so someone whose link expired or was opened on another
 * device can still reset their password.
 */
export async function resetPasswordWithCode(
  _previous: ActionResult<{ next: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ next: string }>> {
  const parsed = resetCodeSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const limit = checkRateLimit(
    `reset-code:${parsed.data.email.toLowerCase()}`,
    5,
    15 * 60 * 1000,
  );
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Too many attempts. Wait a few minutes and try again.");
  }

  let recoveryEmail: string | null = null;

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.code,
      type: "recovery",
    });

    if (error || !data.user?.email) {
      return fail(
        "RESET_CODE_FAILED",
        "That code is not valid or has expired. Request a new one.",
      );
    }

    recoveryEmail = data.user.email;
  } catch (error) {
    return fail("RESET_CODE_FAILED", errorMessage(error, "We couldn't check that code."));
  }

  // The code signs the person in. A signed cookie records that recovery was
  // proven, so a normal session alone cannot unlock the password form.
  await grantResetSession(recoveryEmail!);
  redirect(
    `/reset-password?email=${encodeURIComponent(recoveryEmail!)}`,
  );
}

export async function resetPassword(
  _previous: ActionResult<{ next: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ next: string }>> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  try {
    const supabase = await createServerSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (
      userError ||
      !userData.user?.email ||
      userData.user.email.toLowerCase() !== parsed.data.email.toLowerCase() ||
      !(await hasResetSession(parsed.data.email))
    ) {
      return fail(
        "RESET_FAILED",
        "This reset link is no longer valid. Request a new link or use the code from the email.",
      );
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      return fail(
        "RESET_FAILED",
        "That reset link has expired. Request a new link and try again.",
      );
    }

    await clearResetSession();
  } catch (error) {
    return fail("RESET_FAILED", errorMessage(error, "We couldn't update your password."));
  }

  redirect("/account?password=updated");
}
