"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actions/result";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { FormMessage } from "@/components/mend/form-message";
import { cn } from "@/lib/cn";

type Action = (
  previous: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

export function ActionForm({
  action,
  fields,
  label,
  pendingLabel,
  variant = "primary",
  confirmMessage,
  successMessage,
  className,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  variant?: ButtonVariant;
  confirmMessage?: string;
  successMessage?: string;
  className?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form
      action={formAction}
      className={cn("space-y-2", className)}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button
        type="submit"
        variant={variant}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (pendingLabel ?? label) : label}
      </Button>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        success={state?.ok ? successMessage : null}
      />
    </form>
  );
}
