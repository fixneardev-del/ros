"use client";

import { useActionState } from "react";
import { updateNotificationPreferencesAction } from "@/lib/actions/notifications";
import type { NotificationPreference } from "@/lib/types";
import { FormMessage } from "@/components/mend/form-message";
import { SubmitButton } from "@/components/mend/submit-button";

function Choice({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 shrink-0 accent-[var(--d-orange)]"
      />
      <span>
        <span className="block font-bold">{label}</span>
        <span className="mt-0.5 block text-sm text-muted">{description}</span>
      </span>
    </label>
  );
}

export function NotificationPreferencesForm({
  preferences,
}: {
  preferences: NotificationPreference;
}) {
  const [state, action] = useActionState(
    updateNotificationPreferencesAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        success={state?.ok ? "Your notification settings are saved." : null}
      />

      <Choice
        name="emailEnabled"
        label="Email updates"
        description="Send me optional marketplace updates by email. Sign-in, moderation and security email is always sent."
        defaultChecked={preferences.email_enabled}
      />
      <Choice
        name="jobUpdates"
        label="Job updates"
        description="Email me when a job I offered on is marked completed. Cancellations are always sent."
        defaultChecked={preferences.job_updates}
      />
      <Choice
        name="offerUpdates"
        label="Offer updates"
        description="Email me when an offer is not chosen. An accepted offer is always sent."
        defaultChecked={preferences.offer_updates}
      />

      <SubmitButton
        label="Save notification settings"
        pendingLabel="Saving settings"
        className="w-full sm:w-auto"
      />
    </form>
  );
}
