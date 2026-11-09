import { AlertCircle, CheckCircle2 } from "lucide-react";

export function FormMessage({
  error,
  fields,
  success,
}: {
  error?: string | null;
  fields?: Record<string, string>;
  success?: string | null;
}) {
  if (!error && !success) return null;

  if (success && !error) {
    return (
      <div
        role="status"
        className="flex items-start gap-2 rounded-control bg-success-bg p-4 text-sm font-bold text-success-fg"
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
        {success}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-control bg-danger-bg p-4 text-sm text-danger-fg"
    >
      <p className="flex items-start gap-2 font-bold">
        <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
        {error}
      </p>
      {fields && Object.keys(fields).length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-7">
          {Object.entries(fields).map(([field, message]) => (
            <li key={field}>
              <a href={`#${field}`} className="underline">
                {message}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
