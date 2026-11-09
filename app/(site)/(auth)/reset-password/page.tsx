import type { Metadata } from "next";
import { AuthShell } from "@/components/mend/auth-shell";
import { ResetPasswordForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account help"
      title="Choose a new password"
      description="Use at least 10 characters. You will be signed in after the change."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
