import { z } from "zod";
import { reasonSchema, uuidSchema } from "@/lib/schemas/common";

export const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Enter a category name.").max(80, "Use 80 characters or fewer."),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a slug.")
    .max(80, "Use 80 characters or fewer.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  parentId: z.uuid().optional().or(z.literal("")),
  description: z.string().trim().max(300, "Use 300 characters or fewer.").optional(),
  requiresExtraChecks: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export const districtSchema = z.object({
  id: z.uuid().optional(),
  postcodeDistrict: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{1,2}\d[A-Z\d]?$/, "Enter a district like G12."),
  areaName: z.string().trim().min(2, "Enter an area name.").max(80, "Use 80 characters or fewer."),
  isEnabled: z.boolean(),
});

export const providerDecisionSchema = z.object({
  providerId: uuidSchema,
  reason: reasonSchema.optional(),
  extraChecksConfirmed: z.boolean().optional(),
});

export const removalSchema = z.object({
  id: uuidSchema,
  reason: reasonSchema,
});

export const resolveReportSchema = z.object({
  id: uuidSchema,
  status: z.enum(["reviewed", "dismissed"]),
});

export const siteSettingSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.string().trim().max(2000),
});
