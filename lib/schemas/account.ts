import { z } from "zod";
import { nameSchema, passwordSchema, phoneSchema } from "@/lib/schemas/common";

export const accountSchema = z.object({
  fullName: nameSchema,
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
