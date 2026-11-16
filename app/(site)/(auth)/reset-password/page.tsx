import type { Metadata } from "next";
import { AuthShell } from "@/components/mend/auth-shell";
import { ResetCodeForm, ResetPasswordForm } from "@/components/forms/auth-forms";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reset password" };

type SearchParams = Promise<{ email?: string | string[] }>;

// The page checks for a reset session before it can choose a form, so it
// cannot be prerendered.
export const instant = false;

async function resetSessionEmail() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // A recovery link or code both identify the account being reset. An
  // unrelated signed-in session is not enough to expose the password form.
  const params = await searchParams;
  const sessionEmail = await resetSessionEmail();
  const requestedEmail =
    typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  const canResetPassword = Boolean(
    sessionEmail && requestedEmail === sessionEmail.toLowerCase(),
  );

  return (
    <AuthShell
      eyebrow="Account help"
      title={canResetPassword ? "Choose a new password" : "Enter your reset code"}
      description={
        canResetPassword
          ? "Use at least 10 characters. You will be signed in after the change."
          : "Use the 6-digit code from the reset email. If it has expired, request a new one."
      }
    >
      {canResetPassword ? (
        <ResetPasswordForm email={sessionEmail!} />
      ) : (
        <ResetCodeForm />
      )}
    </AuthShell>
  );
}
