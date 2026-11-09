import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter a name between 2 and 80 characters.")
  .max(80, "Enter a name between 2 and 80 characters.");

export const emailSchema = z
  .string()
  .trim()
  .min(3, "Enter a valid email address.")
  .max(254, "Enter a valid email address.")
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "Use 200 characters or fewer.");

export const uuidSchema = z.uuid("Choose an item from the list.");

export const phoneSchema = z
  .string()
  .trim()
  .max(30, "Use 30 characters or fewer.")
  .optional();

export const reasonSchema = z
  .string()
  .trim()
  .min(10, "Write at least 10 characters so the person knows what to fix.")
  .max(500, "Use 500 characters or fewer.");

export function textValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function nullIfBlank(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
