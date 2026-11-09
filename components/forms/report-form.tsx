"use client";

import { useActionState, useId } from "react";
import { reportContent } from "@/lib/actions/jobs";
import { Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/mend/form-message";
import { SubmitButton } from "@/components/mend/submit-button";

export function ReportForm({
  targetType,
  targetId,
}: {
  targetType: "provider" | "job";
  targetId: string;
}) {
  const [state, action] = useActionState(reportContent, null);
  const reasonId = useId();

  return (
    <details className="s-panel rounded-surface border border-line bg-surface p-4">
      <summary className="cursor-pointer text-sm font-bold text-muted">
        Report this {targetType}
      </summary>
      <form action={action} className="mt-4 space-y-4">
        <FormMessage
          error={state && !state.ok ? state.error.message : null}
          fields={state && !state.ok ? state.error.fields : undefined}
          success={state?.ok ? "Thank you. An admin will review this." : null}
        />
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <label htmlFor={reasonId} className="block text-sm font-bold">
          What is wrong?
        </label>
        <Textarea
          id={reasonId}
          name="reason"
          minLength={10}
          maxLength={1000}
          required
          placeholder="Tell us what happened or what looks unsafe."
        />
        <SubmitButton
          label="Send report"
          pendingLabel="Sending report"
          variant="secondary"
        />
      </form>
    </details>
  );
}
