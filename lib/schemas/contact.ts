import { z } from "zod";
import { emailSchema, nameSchema } from "@/lib/schemas/common";

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z
    .string()
    .trim()
    .min(3, "Enter a short subject.")
    .max(120, "Use 120 characters or fewer for the subject."),
  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more in at least 20 characters.")
    .max(2000, "Use 2000 characters or fewer."),
  // Hidden honeypot. A human leaves it empty; a casual bot fills every input.
  company: z.string().max(0).optional(),
});
