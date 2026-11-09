"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { requireAdmin } from "@/lib/permissions";
import {
  categorySchema,
  districtSchema,
  resolveReportSchema,
  siteSettingSchema,
} from "@/lib/schemas/admin";
import { reasonSchema, uuidSchema } from "@/lib/schemas/common";
import { writeAudit } from "@/lib/audit";
import { emit } from "@/lib/events";
import { getUserEmail } from "@/lib/auth-admin";

function messageFor(error: ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

function back(path: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params).toString();
  redirect(`${path}?${search}`);
}

function okBack(path: string, message: string): never {
  return back(path, { ok: message });
}

function errorBack(path: string, message: string): never {
  return back(path, { error: message });
}

export async function approveProvider(formData: FormData) {
  const context = await requireAdmin();
  const providerId = uuidSchema.safeParse(formData.get("providerId"));
  const extraChecksConfirmed = formData.get("extraChecksConfirmed") === "on";
  const path = "/admin/providers";

  if (!providerId.success) return errorBack(path, "Choose a provider.");

  const { data: provider } = await context.supabase
    .from("provider_profiles")
    .select(
      "user_id, display_name, provider_services(category_id, service_categories(requires_extra_checks))",
    )
    .eq("user_id", providerId.data)
    .maybeSingle();

  if (!provider) return errorBack(path, "That provider could not be found.");

  const services = (provider.provider_services ?? []) as unknown as Array<{
    service_categories: { requires_extra_checks: boolean } | null;
  }>;
  const requiresChecks = services.some(
    (service) => service.service_categories?.requires_extra_checks,
  );

  if (requiresChecks && !extraChecksConfirmed) {
    return errorBack(
      path,
      "Confirm you have seen the evidence required for this category before approving.",
    );
  }

  const { error } = await context.supabase
    .from("provider_profiles")
    .update({
      status: "approved",
      rejection_reason: null,
      needs_more_info_note: null,
      reviewed_by: context.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", providerId.data);

  if (error) return errorBack(path, "We couldn't approve that provider. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "provider.approved",
    entityType: "provider",
    entityId: providerId.data,
    metadata: { extraChecksConfirmed },
  });

  await emit("provider.approved", {
    providerEmail: await getUserEmail(providerId.data),
    providerName: provider.display_name,
  });

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${providerId.data}`);
  revalidatePath(`/providers/${providerId.data}`);
  revalidatePath("/search");
  return okBack(path, "Provider approved.");
}

export async function rejectProvider(formData: FormData) {
  const context = await requireAdmin();
  const providerId = uuidSchema.safeParse(formData.get("providerId"));
  const reason = reasonSchema.safeParse(formData.get("reason"));
  const path = "/admin/providers";

  if (!providerId.success) return errorBack(path, "Choose a provider.");
  if (!reason.success) return errorBack(path, messageFor(reason.error));

  const { data: provider } = await context.supabase
    .from("provider_profiles")
    .select("user_id, display_name")
    .eq("user_id", providerId.data)
    .maybeSingle();

  if (!provider) return errorBack(path, "That provider could not be found.");

  const { error } = await context.supabase
    .from("provider_profiles")
    .update({
      status: "rejected",
      rejection_reason: reason.data,
      reviewed_by: context.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", providerId.data);

  if (error) return errorBack(path, "We couldn't save that decision. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "provider.rejected",
    entityType: "provider",
    entityId: providerId.data,
    metadata: { reason: reason.data },
  });

  await emit("provider.rejected", {
    providerEmail: await getUserEmail(providerId.data),
    providerName: provider.display_name,
    reason: reason.data,
  });

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${providerId.data}`);
  revalidatePath(`/providers/${providerId.data}`);
  revalidatePath("/search");
  return okBack(path, "Provider not approved.");
}

export async function requestMoreInfo(formData: FormData) {
  const context = await requireAdmin();
  const providerId = uuidSchema.safeParse(formData.get("providerId"));
  const note = reasonSchema.safeParse(formData.get("note"));
  const path = "/admin/providers";

  if (!providerId.success) return errorBack(path, "Choose a provider.");
  if (!note.success) return errorBack(path, messageFor(note.error));

  const { data: provider } = await context.supabase
    .from("provider_profiles")
    .select("user_id, display_name")
    .eq("user_id", providerId.data)
    .maybeSingle();

  if (!provider) return errorBack(path, "That provider could not be found.");

  const { error } = await context.supabase
    .from("provider_profiles")
    .update({
      status: "pending",
      needs_more_info_note: note.data,
      reviewed_by: context.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", providerId.data);

  if (error) return errorBack(path, "We couldn't save that request. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "provider.more_info_requested",
    entityType: "provider",
    entityId: providerId.data,
    metadata: { note: note.data },
  });

  await emit("provider.more_info_requested", {
    providerEmail: await getUserEmail(providerId.data),
    providerName: provider.display_name,
    note: note.data,
  });

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${providerId.data}`);
  return okBack(path, "More information requested.");
}

export async function suspendProvider(formData: FormData) {
  const context = await requireAdmin();
  const providerId = uuidSchema.safeParse(formData.get("providerId"));
  const path = "/admin/providers";

  if (!providerId.success) return errorBack(path, "Choose a provider.");

  const { error } = await context.supabase
    .from("provider_profiles")
    .update({
      status: "suspended",
      suspended_by: context.user.id,
      suspended_at: new Date().toISOString(),
      reviewed_by: context.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", providerId.data);

  if (error) return errorBack(path, "We couldn't suspend that provider. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "provider.suspended",
    entityType: "provider",
    entityId: providerId.data,
  });

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${providerId.data}`);
  revalidatePath(`/providers/${providerId.data}`);
  revalidatePath("/search");
  return okBack(path, "Provider suspended.");
}

export async function reinstateProvider(formData: FormData) {
  const context = await requireAdmin();
  const providerId = uuidSchema.safeParse(formData.get("providerId"));
  const path = "/admin/providers";

  if (!providerId.success) return errorBack(path, "Choose a provider.");

  const { error } = await context.supabase
    .from("provider_profiles")
    .update({
      status: "approved",
      suspended_by: null,
      suspended_at: null,
      reviewed_by: context.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", providerId.data);

  if (error) return errorBack(path, "We couldn't reinstate that provider. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "provider.reinstated",
    entityType: "provider",
    entityId: providerId.data,
  });

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${providerId.data}`);
  revalidatePath(`/providers/${providerId.data}`);
  revalidatePath("/search");
  return okBack(path, "Provider reinstated.");
}

/**
 * Removes a provider application outright. The account stays, so the person
 * can apply again. Services, photos and offers go with the profile.
 */
export async function removeProvider(formData: FormData) {
  const context = await requireAdmin();
  const providerId = uuidSchema.safeParse(formData.get("providerId"));
  const reason = reasonSchema.safeParse(formData.get("reason"));
  const path = "/admin/providers";

  if (!providerId.success) return errorBack(path, "Choose a provider.");
  if (!reason.success) return errorBack(path, messageFor(reason.error));

  const { data: provider } = await context.supabase
    .from("provider_profiles")
    .select("user_id, display_name, provider_photos(storage_path)")
    .eq("user_id", providerId.data)
    .maybeSingle();

  if (!provider) return errorBack(path, "That provider could not be found.");

  const photos = (provider.provider_photos ?? []) as unknown as Array<{
    storage_path: string;
  }>;

  if (photos.length > 0) {
    await context.supabase.storage
      .from("provider-photos")
      .remove(photos.map((photo) => photo.storage_path));
  }

  const { error } = await context.supabase
    .from("provider_profiles")
    .delete()
    .eq("user_id", providerId.data);

  if (error) return errorBack(path, "We couldn't remove that provider. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "provider.removed",
    entityType: "provider",
    entityId: providerId.data,
    metadata: { reason: reason.data },
  });

  await emit("provider.removed", {
    providerEmail: await getUserEmail(providerId.data),
    providerName: provider.display_name,
    reason: reason.data,
  });

  revalidatePath("/admin/providers");
  revalidatePath(`/providers/${providerId.data}`);
  revalidatePath("/search");
  return okBack(path, "Provider removed.");
}

export async function removeJob(formData: FormData) {
  const context = await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const reason = reasonSchema.safeParse(formData.get("reason"));
  const path = "/admin/jobs";

  if (!id.success) return errorBack(path, "Choose a job.");
  if (!reason.success) return errorBack(path, messageFor(reason.error));

  const { data: job } = await context.supabase
    .from("job_requests")
    .select("id, title, customer_id")
    .eq("id", id.data)
    .maybeSingle();

  if (!job) return errorBack(path, "That job could not be found.");

  const { error } = await context.supabase
    .from("job_requests")
    .update({
      status: "removed",
      removed_reason: reason.data,
      removed_by: context.user.id,
      removed_at: new Date().toISOString(),
    })
    .eq("id", id.data);

  if (error) return errorBack(path, "We couldn't remove that job. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "job.removed",
    entityType: "job",
    entityId: id.data,
    metadata: { reason: reason.data },
  });

  await emit("job.removed", {
    customerEmail: await getUserEmail(job.customer_id),
    customerName: "there",
    jobTitle: job.title,
    reason: reason.data,
  });

  revalidatePath("/admin/jobs");
  revalidatePath(`/jobs/${id.data}`);
  revalidatePath("/provide/jobs");
  revalidatePath("/jobs");
  return okBack(path, "Job removed.");
}

export async function removeOffer(formData: FormData) {
  const context = await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const reason = reasonSchema.safeParse(formData.get("reason"));
  const path = "/admin/offers";

  if (!id.success) return errorBack(path, "Choose an offer.");
  if (!reason.success) return errorBack(path, messageFor(reason.error));

  const { error } = await context.supabase
    .from("provider_offers")
    .update({
      status: "withdrawn",
      removed_by: context.user.id,
      removed_at: new Date().toISOString(),
    })
    .eq("id", id.data);

  if (error) return errorBack(path, "We couldn't remove that offer. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "offer.removed",
    entityType: "offer",
    entityId: id.data,
    metadata: { reason: reason.data },
  });

  revalidatePath("/admin/offers");
  revalidatePath("/provide/offers");
  return okBack(path, "Offer removed.");
}

export async function suspendUser(formData: FormData) {
  const context = await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const path = "/admin/users";

  if (!id.success) return errorBack(path, "Choose a user.");

  const { error } = await context.supabase
    .from("profiles")
    .update({
      is_suspended: true,
      suspended_by: context.user.id,
      suspended_at: new Date().toISOString(),
    })
    .eq("id", id.data);

  if (error) return errorBack(path, "We couldn't suspend that account. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "user.suspended",
    entityType: "user",
    entityId: id.data,
  });

  revalidatePath("/admin/users");
  return okBack(path, "Account suspended.");
}

export async function unsuspendUser(formData: FormData) {
  const context = await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const path = "/admin/users";

  if (!id.success) return errorBack(path, "Choose a user.");

  const { error } = await context.supabase
    .from("profiles")
    .update({ is_suspended: false, suspended_by: null, suspended_at: null })
    .eq("id", id.data);

  if (error) return errorBack(path, "We couldn't reinstate that account. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "user.unsuspended",
    entityType: "user",
    entityId: id.data,
  });

  revalidatePath("/admin/users");
  return okBack(path, "Account reinstated.");
}

export async function upsertCategory(formData: FormData) {
  const context = await requireAdmin();
  const path = "/admin/categories";
  const parsed = categorySchema.safeParse({
    id: formData.get("id")?.toString() || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    parentId: formData.get("parentId")?.toString() || "",
    description: formData.get("description")?.toString(),
    requiresExtraChecks: formData.get("requiresExtraChecks") === "on",
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) return errorBack(path, messageFor(parsed.error));

  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    parent_id: parsed.data.parentId || null,
    description: parsed.data.description?.trim() || null,
    requires_extra_checks: parsed.data.requiresExtraChecks,
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await context.supabase.from("service_categories").update(payload).eq("id", parsed.data.id)
    : await context.supabase.from("service_categories").insert(payload);

  if (error) return errorBack(path, "We couldn't save that category. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: parsed.data.id ? "category.updated" : "category.created",
    entityType: "category",
    entityId: parsed.data.id ?? parsed.data.slug,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/post-job");
  revalidatePath("/provide/apply");
  return okBack(path, "Category saved.");
}

/**
 * Moves a category one place up or down within its own group. The swap runs
 * as one database function so two admins cannot half-swap the order.
 */
export async function moveCategory(formData: FormData) {
  const context = await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const direction = formData.get("direction")?.toString();
  const path = "/admin/categories";

  if (!id.success) return errorBack(path, "Choose a category.");
  if (direction !== "up" && direction !== "down") {
    return errorBack(path, "Choose a direction.");
  }

  const { error } = await context.supabase.rpc("swap_category_order", {
    p_category_id: id.data,
    p_direction: direction,
  });

  if (error) return errorBack(path, "We couldn't move that category. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "category.reordered",
    entityType: "category",
    entityId: id.data,
    metadata: { direction },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/post-job");
  revalidatePath("/provide/apply");
  return okBack(path, direction === "up" ? "Category moved up." : "Category moved down.");
}

export async function setCategoryActive(formData: FormData) {
  const context = await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const active = formData.get("active") === "true";
  const path = "/admin/categories";

  if (!id.success) return errorBack(path, "Choose a category.");

  const { error } = await context.supabase
    .from("service_categories")
    .update({ is_active: active })
    .eq("id", id.data);

  if (error) return errorBack(path, "We couldn't update that category. Try again.");

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/search");
  return okBack(path, active ? "Category activated." : "Category deactivated.");
}

export async function upsertDistrict(formData: FormData) {
  const context = await requireAdmin();
  const path = "/admin/pilot-area";
  const parsed = districtSchema.safeParse({
    id: formData.get("id")?.toString() || undefined,
    postcodeDistrict: formData.get("postcodeDistrict"),
    areaName: formData.get("areaName"),
    isEnabled: formData.get("isEnabled") === "on",
  });

  if (!parsed.success) return errorBack(path, messageFor(parsed.error));

  const payload = {
    postcode_district: parsed.data.postcodeDistrict,
    area_name: parsed.data.areaName,
    is_enabled: parsed.data.isEnabled,
  };

  const { error } = parsed.data.id
    ? await context.supabase.from("locations").update(payload).eq("id", parsed.data.id)
    : await context.supabase.from("locations").insert(payload);

  if (error) return errorBack(path, "We couldn't save that district. Try again.");

  revalidatePath("/admin/pilot-area");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/provide/apply");
  return okBack(path, "Pilot area saved.");
}

export async function setDistrictEnabled(formData: FormData) {
  const context = await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const enabled = formData.get("enabled") === "true";
  const path = "/admin/pilot-area";

  if (!id.success) return errorBack(path, "Choose a district.");

  const { error } = await context.supabase
    .from("locations")
    .update({ is_enabled: enabled })
    .eq("id", id.data);

  if (error) return errorBack(path, "We couldn't update that district. Try again.");

  revalidatePath("/admin/pilot-area");
  revalidatePath("/");
  revalidatePath("/search");
  return okBack(path, enabled ? "District enabled." : "District disabled.");
}

export async function resolveReport(formData: FormData) {
  const context = await requireAdmin();
  const path = "/admin/reports";
  const parsed = resolveReportSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) return errorBack(path, messageFor(parsed.error));

  const { error } = await context.supabase
    .from("reports")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) return errorBack(path, "We couldn't update that report. Try again.");

  revalidatePath("/admin/reports");
  return okBack(path, "Report updated.");
}

export async function updateSiteSetting(formData: FormData) {
  const context = await requireAdmin();
  const path = "/admin";
  const parsed = siteSettingSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
  });

  if (!parsed.success) return errorBack(path, messageFor(parsed.error));

  const { error } = await context.supabase.from("site_settings").upsert({
    key: parsed.data.key,
    value: parsed.data.value,
  });

  if (error) return errorBack(path, "We couldn't save that setting. Try again.");

  revalidatePath("/");
  revalidatePath("/admin");
  return okBack(path, "Setting saved.");
}
