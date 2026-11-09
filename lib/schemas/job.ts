import { z } from "zod";
import { uuidSchema } from "@/lib/schemas/common";

export const TIMEFRAMES = [
  "today",
  "this_week",
  "next_two_weeks",
  "flexible",
] as const;

export const timeframeLabels: Record<(typeof TIMEFRAMES)[number], string> = {
  today: "Today",
  this_week: "This week",
  next_two_weeks: "Next 2 weeks",
  flexible: "Flexible",
};

export const jobSchema = z.object({
  categoryId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(5, "Enter a short title between 5 and 100 characters.")
    .max(100, "Enter a short title between 5 and 100 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Describe the job in at least 20 characters.")
    .max(2000, "Use 2000 characters or fewer."),
  postcode: z.string().trim().min(5, "Enter a postcode.").max(10, "Enter a postcode."),
  timeframe: z.enum(TIMEFRAMES, "Choose when you need the job done."),
});

export const jobUpdateSchema = jobSchema.pick({
  title: true,
  description: true,
  timeframe: true,
});
