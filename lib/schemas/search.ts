import { z } from "zod";
import { emailSchema } from "@/lib/schemas/common";

export const waitlistSchema = z.object({
  email: emailSchema,
  postcode: z.string().trim().min(5, "Enter your postcode.").max(10, "Enter your postcode."),
});

export const reportSchema = z.object({
  targetType: z.enum(["provider", "job"]),
  targetId: z.uuid("Choose something to report."),
  reason: z
    .string()
    .trim()
    .min(10, "Tell us what is wrong in at least 10 characters.")
    .max(500, "Use 500 characters or fewer."),
});
