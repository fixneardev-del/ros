import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

export function StitchLine({ className }: { className?: string }) {
  return <div className={cn("stitch-x", className)} aria-hidden />;
}

export function PilotNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "stitch-box flex items-start gap-3 bg-info-bg p-4 text-info-fg",
        className,
      )}
    >
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p className="text-sm leading-6">{children}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-muted">{description}</p>
      <div className="mt-4">
        <StitchLine className="mx-auto w-24" />
      </div>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div aria-live="polite">
      <div className="flex gap-2" aria-hidden>
        {steps.map((step, index) => (
          <div
            key={step}
            className={cn(
              "h-2 flex-1 rounded-full",
              index <= current ? "bg-primary" : "stitch-x bg-transparent",
            )}
          />
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">
        Step {Math.min(current + 1, steps.length)} of {steps.length}:{" "}
        <span className="font-bold text-ink">{steps[current]}</span>
      </p>
    </div>
  );
}
