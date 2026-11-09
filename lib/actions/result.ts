import type { ZodError } from "zod";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fields?: Record<string, string>;
      };
    };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(
  code: string,
  message: string,
  fields?: Record<string, string>,
): ActionResult<never> {
  return { ok: false, error: { code, message, fields } };
}

export function fromZodError(error: ZodError): ActionResult<never> {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }

  return fail("VALIDATION", "Check the highlighted fields and try again.", fields);
}

export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
