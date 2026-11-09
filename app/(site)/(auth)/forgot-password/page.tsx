import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/mend/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account help"
      title="Forgot your password?"
      description="Enter the email on your account. If it matches, we will send a reset link."
      footer={
        <Link href="/login" className="font-bold text-primary underline">
          Back to log in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
