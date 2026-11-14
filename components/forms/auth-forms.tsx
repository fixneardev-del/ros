"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  signIn,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "@/lib/actions/auth";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { FormMessage } from "@/components/mend/form-message";
import { SubmitButton } from "@/components/mend/submit-button";

function fieldsFrom(state: { ok: boolean; error?: { fields?: Record<string, string> } } | null) {
  return state && !state.ok ? state.error?.fields : undefined;
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState(registerUser, null);

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
        id="acceptedTerms"
        name="acceptedTerms"
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
      <SubmitButton label="Create account" pendingLabel="Creating account" />
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, null);

  return (
    <form action={action} className="space-y-5" noValidate>
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
            ? "If an account uses that email, we have sent a reset link."
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

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
      />
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
