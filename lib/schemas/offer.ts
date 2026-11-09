import { z } from "zod";

export const offerSchema = z.object({
  message: z
    .string()
    .trim()
    .min(20, "Write at least 20 characters about how you can help.")
    .max(1000, "Use 1000 characters or fewer."),
  price: z
    .string()
    .trim()
    .max(12, "Enter a price in pounds, or leave it blank.")
    .optional(),
  estimatedTimeframe: z
    .string()
    .trim()
    .max(80, "Use 80 characters or fewer.")
    .optional(),
});

export function parsePricePence(value: string | undefined) {
  if (!value || !value.trim()) return null;

  const normalised = value.replace(/[£,\s]/g, "");
  const pounds = Number(normalised);

  if (!Number.isFinite(pounds) || pounds < 0 || pounds > 100000) {
    return undefined;
  }

  return Math.round(pounds * 100);
}
