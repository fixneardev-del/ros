"use client";

import { useActionState } from "react";
import { joinWaitlist } from "@/lib/actions/search";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/mend/form-message";
import { SubmitButton } from "@/components/mend/submit-button";

export function WaitlistForm({ postcode = "" }: { postcode?: string }) {
  const [state, action] = useActionState(joinWaitlist, null);

  return (
    <form action={action} className="space-y-4">
      <FormMessage
        error={state && !state.ok ? state.error : null}
        success={
          state?.ok
            ? "Thanks. We will email you when we reach your area."
            : null
        }
      />
      <Field label="Email" htmlFor="waitlist-email">
        <Input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Field>
      <Field label="Postcode" htmlFor="waitlist-postcode">
        <Input
          id="waitlist-postcode"
          name="postcode"
          defaultValue={postcode}
          autoComplete="postal-code"
          required
        />
      </Field>
      <SubmitButton
        label="Tell me when you arrive"
        pendingLabel="Saving your interest"
      />
    </form>
  );
}
