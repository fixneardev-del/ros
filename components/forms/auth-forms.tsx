"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  signIn,
  registerUser,
  requestPasswordReset,
  resetPassword,
  resetPasswordWithCode,
} from "@/lib/actions/auth";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { FormMessage } from "@/components/mend/form-message";
import { SubmitButton } from "@/components/mend/submit-button";
import {
  ACCEPTED_TERMS_ID,
  GoogleAuthButton,
} from "@/components/forms/google-auth-button";

function fieldsFrom(state: { ok: boolean; error?: { fields?: Record<string, string> } } | null) {
  return state && !state.ok ? state.error?.fields : undefined;
}

function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span>or</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState(registerUser, null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
      />
      <input type="hidden" name="next" value={next} />
      <Field label="Your name" htmlFor="fullName">
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        hint="Use at least 10 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <Checkbox
        id={ACCEPTED_TERMS_ID}
        name="acceptedTerms"
        checked={acceptedTerms}
        onChange={(event) => setAcceptedTerms(event.target.checked)}
        label={
          <>
            I agree to the{" "}
            <Link href="/terms" className="font-bold text-primary underline">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-bold text-primary underline">
              privacy notice
            </Link>
            .
          </>
        }
      />
      <GoogleAuthButton
        next={next}
        requireTerms
        acceptedTerms={acceptedTerms}
      />
      <AuthDivider />
      <SubmitButton label="Create account" pendingLabel="Creating account" />
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <GoogleAuthButton next={next} />
      <AuthDivider />
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
      />
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <SubmitButton label="Log in" pendingLabel="Logging in" />
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/forgot-password" className="font-bold text-primary underline">
          Forgot your password?
        </Link>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
        success={
          state?.ok
            ? "If an account uses that email, we have sent a reset link. If the email includes a 6-digit code, you can use it if the link expires."
            : null
        }
      />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <SubmitButton label="Send reset link" pendingLabel="Sending link" />
    </form>
  );
}

export function ResetPasswordForm({ email }: { email: string }) {
  const [state, action] = useActionState(resetPassword, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
      />
      <input type="hidden" name="email" value={email} />
      <p className="text-sm text-muted">
        Resetting the password for <strong className="text-ink">{email}</strong>.
      </p>
      <Field
        label="New password"
        htmlFor="password"
        hint="Use at least 10 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <SubmitButton label="Update password" pendingLabel="Updating password" />
    </form>
  );
}

/**
 * Shown when the reset page is opened without a session, for example after
 * the link expired or when the email was opened on a different device.
 */
export function ResetCodeForm() {
  const [state, action] = useActionState(resetPasswordWithCode, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
      />
      <Field label="Email" htmlFor="reset-email">
        <Input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Field>
      <Field
        label="6-digit code"
        htmlFor="reset-code"
        hint="The code is in the reset email, next to the button."
      >
        <Input
          id="reset-code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          required
        />
      </Field>
      <SubmitButton label="Use this code" pendingLabel="Checking code" />
    </form>
  );
}
