"use client";

import { useActionState } from "react";
import { changePassword, updateAccount } from "@/lib/actions/account";
import type { Profile } from "@/lib/types";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/mend/form-message";
import { SubmitButton } from "@/components/mend/submit-button";

function fieldsFrom(state: { ok: boolean; error?: { fields?: Record<string, string> } } | null) {
  return state && !state.ok ? state.error?.fields : undefined;
}

export function AccountForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateAccount, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
        success={state?.ok ? "Your details are saved." : null}
      />
      <Field label="Your name" htmlFor="fullName">
        <Input
          id="fullName"
          name="fullName"
          defaultValue={profile.full_name}
          autoComplete="name"
          required
        />
      </Field>
      <Field
        label="Phone"
        htmlFor="phone"
        hint="Optional. Only shared after you accept an offer."
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          autoComplete="tel"
        />
      </Field>
      <SubmitButton label="Save details" pendingLabel="Saving details" />
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
        success={state?.ok ? "Your password is updated." : null}
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
