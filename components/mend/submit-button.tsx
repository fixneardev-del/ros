"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "@/components/ui/button";

export function SubmitButton({
  label,
  pendingLabel,
  variant = "primary",
  className,
}: {
  label: string;
  pendingLabel?: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (pendingLabel ?? label) : label}
    </Button>
  );
}
