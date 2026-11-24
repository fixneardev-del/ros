import { z } from "zod";
import { passwordSchema, phoneSchema } from "@/lib/schemas/common";

// The name comes from the sign-in provider and is locked in the database.
// Only contact details are editable from a dashboard.
export const accountSchema = z.object({
  phone: phoneSchema,
});

export const passwordChangeSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });
