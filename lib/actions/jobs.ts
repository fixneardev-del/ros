"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { jobSchema, jobUpdateSchema } from "@/lib/schemas/job";
import { reportSchema } from "@/lib/schemas/search";
import { validatePostcodeForAction } from "@/lib/actions/search";
import { fail, fromZodError, ok } from "@/lib/actions/result";
import type { ActionResult } from "@/lib/actions/result";
import { MAX_JOB_PHOTOS, photoFiles, validatePhoto } from "@/lib/uploads";
import { emit } from "@/lib/events";
import { getServerEnv } from "@/lib/env";
import { writeAudit } from "@/lib/audit";

export async function createJob(
  _previous: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const context = await requireUser("/post-job");
  const parsed = jobSchema.safeParse({
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    description: formData.get("description"),
    postcode: formData.get("postcode"),
    timeframe: formData.get("timeframe"),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const postcode = await validatePostcodeForAction(parsed.data.postcode);
  if (!postcode.ok) return postcode;

  const { data: category } = await context.supabase
    .from("service_categories")
    .select("id")
    .eq("id", parsed.data.categoryId)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) {
    return fail("CATEGORY", "Choose an active service.", {
      categoryId: "Choose an active service.",
    });
  }

  const files = photoFiles(formData);
  if (files.length > MAX_JOB_PHOTOS) {
    return fail("PHOTOS", `Add up to ${MAX_JOB_PHOTOS} photos.`);
  }

  const validated: Array<{ file: File; extension: string }> = [];
  for (const file of files) {
    const result = await validatePhoto(file);
    if (!result.ok) return fail("PHOTOS", result.message, { photos: result.message });
    validated.push({ file, extension: result.extension });
  }

  const jobId = crypto.randomUUID();
  const uploaded: string[] = [];

  try {
    for (const item of validated) {
      const path = `${context.user.id}/${jobId}/${crypto.randomUUID()}.${item.extension}`;
      const { error } = await context.supabase.storage
        .from("job-photos")
        .upload(path, item.file, { contentType: item.file.type, upsert: false });

      if (error) {
        await context.supabase.storage.from("job-photos").remove(uploaded);
        return fail("PHOTOS", "We couldn't upload that photo. Try again.");
      }
      uploaded.push(path);
    }

    const { error } = await context.supabase.from("job_requests").insert({
      id: jobId,
      customer_id: context.user.id,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      description: parsed.data.description,
      postcode: postcode.data.postcode,
      postcode_district: postcode.data.district,
      timeframe: parsed.data.timeframe,
      status: "open",
    });

    if (error) {
      await context.supabase.storage.from("job-photos").remove(uploaded);
      return fail("CREATE_FAILED", "We couldn't post that job. Check your details and try again.");
    }

    if (uploaded.length > 0) {
      await context.supabase.from("job_photos").insert(
        uploaded.map((path, index) => ({
          job_id: jobId,
          storage_path: path,
          sort_order: index,
        })),
      );
    }

    await writeAudit({
      actorId: context.user.id,
      action: "job.created",
      entityType: "job",
      entityId: jobId,
    });

    await emit("job.created", {
      customerEmail: context.user.email,
      customerName: context.profile.full_name,
      adminEmail: getServerEnv().adminEmail,
      jobTitle: parsed.data.title,
      jobId,
      district: postcode.data.district,
    });

    revalidatePath("/jobs");
    revalidatePath("/provide/jobs");
    revalidatePath("/admin/jobs");

    return ok({ id: jobId });
  } catch {
    await context.supabase.storage.from("job-photos").remove(uploaded);
    return fail("CREATE_FAILED", "We couldn't post that job. Check your connection and try again.");
  }
}

export async function updateJob(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/jobs");
  const id = formData.get("id")?.toString() ?? "";
  const parsed = jobUpdateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    timeframe: formData.get("timeframe"),
  });

  if (!id) return fail("NOT_FOUND", "That job could not be found.");
  if (!parsed.success) return fromZodError(parsed.error);

  const { data: job } = await context.supabase
    .from("job_requests")
    .select("id, customer_id, status, accepted_offer_id")
    .eq("id", id)
    .maybeSingle();

  if (!job || job.customer_id !== context.user.id) {
    return fail("NOT_FOUND", "That job could not be found.");
  }

  if (job.status !== "open" || job.accepted_offer_id) {
    return fail("LOCKED", "You can only edit a job while it is open and has no accepted offer.");
  }

  const { error } = await context.supabase
    .from("job_requests")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      timeframe: parsed.data.timeframe,
    })
    .eq("id", id);

  if (error) return fail("SAVE_FAILED", "We couldn't save that job. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "job.updated",
    entityType: "job",
    entityId: id,
  });

  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs");
  return ok(undefined);
}

export async function closeJob(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/jobs");
  const id = formData.get("id")?.toString() ?? "";

  if (!id) return fail("NOT_FOUND", "That job could not be found.");

  const { data: job } = await context.supabase
    .from("job_requests")
    .select("id, customer_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!job || job.customer_id !== context.user.id) {
    return fail("NOT_FOUND", "That job could not be found.");
  }

  if (!["open", "receiving_offers"].includes(job.status)) {
    return fail("LOCKED", "That job is already closed.");
  }

  const { error } = await context.supabase
    .from("job_requests")
    .update({ status: "closed" })
    .eq("id", id);

  if (error) return fail("SAVE_FAILED", "We couldn't close that job. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "job.closed",
    entityType: "job",
    entityId: id,
  });

  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs");
  revalidatePath("/provide/jobs");
  return ok(undefined);
}

export async function deleteJobPhoto(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/jobs");
  const photoId = formData.get("photoId")?.toString() ?? "";

  if (!photoId) return fail("NOT_FOUND", "That photo could not be found.");

  const { data: photo } = await context.supabase
    .from("job_photos")
    .select("id, job_id, storage_path")
    .eq("id", photoId)
    .maybeSingle();

  if (!photo) return fail("NOT_FOUND", "That photo could not be found.");

  const { data: job } = await context.supabase
    .from("job_requests")
    .select("id, customer_id, status")
    .eq("id", photo.job_id)
    .maybeSingle();

  if (!job || job.customer_id !== context.user.id || job.status !== "open") {
    return fail("LOCKED", "You can only remove photos while the job is open.");
  }

  await context.supabase.storage.from("job-photos").remove([photo.storage_path]);
  await context.supabase.from("job_photos").delete().eq("id", photoId);

  await writeAudit({
    actorId: context.user.id,
    action: "job.photo_removed",
    entityType: "job",
    entityId: photo.job_id,
    metadata: { photo_id: photoId },
  });

  revalidatePath(`/jobs/${photo.job_id}`);
  return ok(undefined);
}

export async function reportContent(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/");
  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await context.supabase.from("reports").insert({
    reporter_id: context.user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
  });

  if (error) return fail("REPORT_FAILED", "We couldn't send that report. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "report.created",
    entityType: parsed.data.targetType,
    entityId: parsed.data.targetId,
  });

  await emit("report.created", {
    adminEmail: getServerEnv().adminEmail,
    targetType: parsed.data.targetType,
    reason: parsed.data.reason,
  });

  return ok(undefined);
}
