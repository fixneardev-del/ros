import { z } from "zod";
import { nameSchema, uuidSchema } from "@/lib/schemas/common";

export const PROVIDER_TYPES = ["individual", "sole_trader", "business"] as const;

export const providerTypeLabels: Record<(typeof PROVIDER_TYPES)[number], string> = {
  individual: "Individual",
  sole_trader: "Sole trader",
  business: "Business",
};

export const providerApplicationSchema = z.object({
  providerType: z.enum(PROVIDER_TYPES, "Choose the type of provider you are."),
  displayName: nameSchema,
  businessName: z
    .string()
    .trim()
    .max(120, "Use 120 characters or fewer.")
    .optional(),
  bio: z
    .string()
    .trim()
    .min(40, "Write at least 40 characters about your work.")
    .max(1500, "Use 1500 characters or fewer."),
  priceNote: z
    .string()
    .trim()
    .max(80, "Use 80 characters or fewer.")
    .optional(),
  categoryIds: z
    .array(uuidSchema)
    .min(1, "Choose at least one service.")
    .max(12, "Choose 12 services or fewer."),
  districts: z
    .array(z.string().trim().regex(/^[A-Z]{1,2}\d[A-Z\d]?$/, "Choose a pilot area."))
    .min(1, "Choose at least one area.")
    .max(12, "Choose 12 areas or fewer."),
  declaration: z
    .boolean()
    .refine((value) => value, "Confirm the declaration to send your application."),
});

export const providerProfileSchema = providerApplicationSchema.pick({
  providerType: true,
  displayName: true,
  businessName: true,
  bio: true,
  priceNote: true,
  categoryIds: true,
  districts: true,
});
