"use server";

import { revalidatePath } from "next/cache";
import { requireProvider, requireUser } from "@/lib/permissions";
import {
  providerApplicationSchema,
  providerProfileSchema,
} from "@/lib/schemas/provider";
import { fail, fromZodError, ok } from "@/lib/actions/result";
import type { ActionResult } from "@/lib/actions/result";
import {
  MAX_PROVIDER_PHOTOS,
  photoFiles,
  validatePhoto,
} from "@/lib/uploads";
import { emit } from "@/lib/events";
import { getServerEnv } from "@/lib/env";
import { writeAudit } from "@/lib/audit";

function selectedValues(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => value.toString());
}

function applicationInput(formData: FormData) {
  return {
    providerType: formData.get("providerType"),
    displayName: formData.get("displayName"),
    businessName: formData.get("businessName")?.toString(),
    bio: formData.get("bio"),
    priceNote: formData.get("priceNote")?.toString(),
    categoryIds: selectedValues(formData, "categoryIds"),
    districts: selectedValues(formData, "districts").map((value) => value.toUpperCase()),
    declaration: formData.get("declaration") === "on",
  };
}

async function validateReferenceData(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  categoryIds: string[],
  districts: string[],
) {
  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id")
      .in("id", categoryIds)
      .eq("is_active", true),
    supabase
      .from("locations")
      .select("postcode_district")
      .in("postcode_district", districts)
      .eq("is_enabled", true),
  ]);

  const validCategories = new Set(((categories ?? []) as { id: string }[]).map((row) => row.id));
  const validDistricts = new Set(
    ((locations ?? []) as { postcode_district: string }[]).map(
      (row) => row.postcode_district,
    ),
  );

  if (categoryIds.some((id) => !validCategories.has(id))) {
    return "Choose active services from the list.";
  }

  if (districts.some((district) => !validDistricts.has(district))) {
    return "Choose pilot areas from the list.";
  }

  return null;
}

export async function submitProviderApplication(
  _previous: ActionResult<{ next: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ next: string }>> {
  const context = await requireUser("/provide/apply");
  const parsed = providerApplicationSchema.safeParse(applicationInput(formData));

  if (!parsed.success) return fromZodError(parsed.error);

  const { data: existing } = await context.supabase
    .from("provider_profiles")
    .select("user_id")
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (existing) {
    return fail(
      "ALREADY_APPLIED",
      "You already have a provider profile. Update it from your provider dashboard.",
    );
  }

  const referenceError = await validateReferenceData(
    context.supabase,
    parsed.data.categoryIds,
    parsed.data.districts,
  );
  if (referenceError) return fail("REFERENCE_DATA", referenceError);

  const files = photoFiles(formData);
  if (files.length < 1) {
    return fail("PHOTOS", "Add at least one photo of your work.", {
      photos: "Add at least one photo of your work.",
    });
  }

  if (files.length > MAX_PROVIDER_PHOTOS) {
    return fail("PHOTOS", `Add up to ${MAX_PROVIDER_PHOTOS} photos.`);
  }

  const validated: Array<{ file: File; extension: string }> = [];
  for (const file of files) {
    const result = await validatePhoto(file);
    if (!result.ok) return fail("PHOTOS", result.message, { photos: result.message });
    validated.push({ file, extension: result.extension });
  }

  const uploaded: string[] = [];

  try {
    for (const item of validated) {
      const path = `${context.user.id}/${crypto.randomUUID()}.${item.extension}`;
      const { error } = await context.supabase.storage
        .from("provider-photos")
        .upload(path, item.file, { contentType: item.file.type, upsert: false });

      if (error) {
        await context.supabase.storage.from("provider-photos").remove(uploaded);
        return fail("PHOTOS", "We couldn't upload that photo. Try again.");
      }
      uploaded.push(path);
    }

    const { error } = await context.supabase.from("provider_profiles").insert({
      user_id: context.user.id,
      provider_type: parsed.data.providerType,
      display_name: parsed.data.displayName,
      business_name: parsed.data.businessName?.trim() || null,
      bio: parsed.data.bio,
      price_note: parsed.data.priceNote?.trim() || null,
      service_districts: parsed.data.districts,
      status: "pending",
      declaration_accepted_at: new Date().toISOString(),
    });

    if (error) {
      await context.supabase.storage.from("provider-photos").remove(uploaded);
      return fail("APPLY_FAILED", "We couldn't send your application. Check your details and try again.");
    }

    const { error: servicesError } = await context.supabase.from("provider_services").insert(
      parsed.data.categoryIds.map((categoryId) => ({
        provider_id: context.user.id,
        category_id: categoryId,
      })),
    );

    if (servicesError) {
      await context.supabase.from("provider_profiles").delete().eq("user_id", context.user.id);
      await context.supabase.storage.from("provider-photos").remove(uploaded);
      return fail("APPLY_FAILED", "We couldn't save your services. Try again.");
    }

    await context.supabase.from("provider_photos").insert(
      uploaded.map((path, index) => ({
        provider_id: context.user.id,
        storage_path: path,
        sort_order: index,
      })),
    );

    await writeAudit({
      actorId: context.user.id,
      action: "provider.applied",
      entityType: "provider",
      entityId: context.user.id,
    });

    await emit("provider.applied", {
      providerEmail: context.user.email,
      providerName: parsed.data.displayName,
      adminEmail: getServerEnv().adminEmail,
    });

    revalidatePath("/provide");
    revalidatePath("/admin/providers");
    revalidatePath("/search");

    return ok({ next: "/provide?applied=1" });
  } catch {
    await context.supabase.storage.from("provider-photos").remove(uploaded);
    return fail("APPLY_FAILED", "We couldn't send your application. Check your connection and try again.");
  }
}

export async function updateProviderProfile(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireProvider();
  const parsed = providerProfileSchema.safeParse(applicationInput(formData));

  if (!parsed.success) return fromZodError(parsed.error);

  const referenceError = await validateReferenceData(
    context.supabase,
    parsed.data.categoryIds,
    parsed.data.districts,
  );
  if (referenceError) return fail("REFERENCE_DATA", referenceError);

  const current = context.providerProfile;
  const keyChanged =
    current.display_name !== parsed.data.displayName ||
    current.provider_type !== parsed.data.providerType;

  const { data: setting } = await context.supabase
    .from("site_settings")
    .select("value")
    .eq("key", "reapprove_on_key_change")
    .maybeSingle();

  const reapprove = (setting as { value: string } | null)?.value !== "false";
  const nextStatus =
    current.status === "approved" && keyChanged && reapprove ? "pending" : current.status;

  const { error } = await context.supabase
    .from("provider_profiles")
    .update({
      provider_type: parsed.data.providerType,
      display_name: parsed.data.displayName,
      business_name: parsed.data.businessName?.trim() || null,
      bio: parsed.data.bio,
      price_note: parsed.data.priceNote?.trim() || null,
      service_districts: parsed.data.districts,
      status: nextStatus,
    })
    .eq("user_id", context.user.id);

  if (error) {
    return fail("SAVE_FAILED", "We couldn't save your profile. Check your details and try again.");
  }

  await context.supabase
    .from("provider_services")
    .delete()
    .eq("provider_id", context.user.id);

  const { error: servicesError } = await context.supabase.from("provider_services").insert(
    parsed.data.categoryIds.map((categoryId) => ({
      provider_id: context.user.id,
      category_id: categoryId,
    })),
  );

  if (servicesError) {
    return fail("SAVE_FAILED", "We saved your profile but not your services. Try again.");
  }

  await writeAudit({
    actorId: context.user.id,
    action: "provider.updated",
    entityType: "provider",
    entityId: context.user.id,
    metadata: { keyChanged, status: nextStatus },
  });

  revalidatePath("/provide");
  revalidatePath(`/providers/${context.user.id}`);
  revalidatePath("/search");
  revalidatePath("/admin/providers");

  return ok(undefined);
}

export async function addProviderPhoto(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireProvider();
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return fail("PHOTO", "Choose a photo to add.", { photo: "Choose a photo to add." });
  }

  const { count } = await context.supabase
    .from("provider_photos")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", context.user.id);

  if ((count ?? 0) >= MAX_PROVIDER_PHOTOS) {
    return fail("PHOTO_LIMIT", `You can add up to ${MAX_PROVIDER_PHOTOS} photos.`);
  }

  const validation = await validatePhoto(file);
  if (!validation.ok) {
    return fail("PHOTO", validation.message, { photo: validation.message });
  }

  const path = `${context.user.id}/${crypto.randomUUID()}.${validation.extension}`;
  const { error: uploadError } = await context.supabase.storage
    .from("provider-photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return fail("PHOTO", "We couldn't upload that photo. Try again.");
  }

  const { error } = await context.supabase.from("provider_photos").insert({
    provider_id: context.user.id,
    storage_path: path,
    sort_order: count ?? 0,
  });

  if (error) {
    await context.supabase.storage.from("provider-photos").remove([path]);
    return fail("PHOTO", "We couldn't add that photo. Try again.");
  }

  await writeAudit({
    actorId: context.user.id,
    action: "provider.photo_added",
    entityType: "provider",
    entityId: context.user.id,
  });

  revalidatePath("/provide");
  revalidatePath(`/providers/${context.user.id}`);
  revalidatePath(`/admin/providers/${context.user.id}`);

  return ok(undefined);
}

export async function updateProviderPhoto(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireProvider();
  const photoId = formData.get("photoId")?.toString() ?? "";
  const altText = formData.get("altText")?.toString().trim() || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!photoId) return fail("NOT_FOUND", "That photo could not be found.");

  const { data: photo } = await context.supabase
    .from("provider_photos")
    .select("id, provider_id")
    .eq("id", photoId)
    .maybeSingle();

  if (!photo || photo.provider_id !== context.user.id) {
    return fail("NOT_FOUND", "That photo could not be found.");
  }

  const { error } = await context.supabase
    .from("provider_photos")
    .update({ alt_text: altText, sort_order: Number.isFinite(sortOrder) ? sortOrder : 0 })
    .eq("id", photoId);

  if (error) return fail("SAVE_FAILED", "We couldn't save that photo. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "provider.photo_updated",
    entityType: "provider",
    entityId: context.user.id,
    metadata: { photo_id: photoId },
  });

  revalidatePath("/provide");
  revalidatePath(`/providers/${context.user.id}`);
  return ok(undefined);
}

export async function deleteProviderPhoto(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireProvider();
  const photoId = formData.get("photoId")?.toString() ?? "";

  if (!photoId) return fail("NOT_FOUND", "That photo could not be found.");

  const { data: photo } = await context.supabase
    .from("provider_photos")
    .select("id, provider_id, storage_path")
    .eq("id", photoId)
    .maybeSingle();

  if (!photo || photo.provider_id !== context.user.id) {
    return fail("NOT_FOUND", "That photo could not be found.");
  }

  await context.supabase.storage.from("provider-photos").remove([photo.storage_path]);
  const { error } = await context.supabase.from("provider_photos").delete().eq("id", photoId);

  if (error) return fail("DELETE_FAILED", "We couldn't remove that photo. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "provider.photo_removed",
    entityType: "provider",
    entityId: context.user.id,
    metadata: { photo_id: photoId },
  });

  revalidatePath("/provide");
  revalidatePath(`/providers/${context.user.id}`);
  revalidatePath(`/admin/providers/${context.user.id}`);
  return ok(undefined);
}
