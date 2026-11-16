import { z } from "zod";
import { emailSchema, nameSchema, passwordSchema } from "@/lib/schemas/common";

export const registerSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  acceptedTerms: z
    .boolean()
    .refine((value) => value, "Accept the terms and privacy notice to continue."),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const resetCodeSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from the email."),
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });
