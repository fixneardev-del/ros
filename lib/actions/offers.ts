"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApprovedProvider, requireUser } from "@/lib/permissions";
import { offerSchema, parsePricePence } from "@/lib/schemas/offer";
import { fail, fromZodError, ok } from "@/lib/actions/result";
import type { ActionResult } from "@/lib/actions/result";
import { providerCoversCategory } from "@/lib/data/jobs";
import { checkRateLimit } from "@/lib/rate-limit";
import { emit } from "@/lib/events";
import { getUserEmail, getUserEmails } from "@/lib/auth-admin";
import { writeAudit } from "@/lib/audit";

export async function createOffer(
  _previous: ActionResult<{ jobId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ jobId: string }>> {
  const context = await requireApprovedProvider();
  const jobId = formData.get("jobId")?.toString() ?? "";

  if (!jobId) return fail("NOT_FOUND", "That job could not be found.");

  const limit = checkRateLimit(`offer:${context.user.id}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "You have sent a lot of offers. Wait an hour and try again.");
  }

  const parsed = offerSchema.safeParse({
    message: formData.get("message"),
    price: formData.get("price")?.toString(),
    estimatedTimeframe: formData.get("estimatedTimeframe")?.toString(),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const pricePence = parsePricePence(parsed.data.price);
  if (pricePence === undefined) {
    return fail("PRICE", "Enter a price in pounds, or leave it blank for a quote on inspection.", {
      price: "Enter a price in pounds, or leave it blank.",
    });
  }

  const { data: job } = await context.supabase
    .from("job_requests")
    .select(
      "id, customer_id, title, status, postcode_district, category_id, service_categories(id, parent_id)",
    )
    .eq("id", jobId)
    .maybeSingle();

  if (!job) return fail("NOT_FOUND", "That job could not be found.");
  if (!["open", "receiving_offers"].includes(job.status)) {
    return fail("JOB_CLOSED", "That job is no longer taking offers.");
  }

  if (!context.providerProfile.service_districts.includes(job.postcode_district)) {
    return fail("AREA", "That job is outside the areas you cover.");
  }

  const { data: services } = await context.supabase
    .from("provider_services")
    .select("category_id")
    .eq("provider_id", context.user.id);

  const category = job.service_categories as unknown as {
    id: string;
    parent_id: string | null;
  } | null;

  if (
    !category ||
    !providerCoversCategory(
      ((services ?? []) as { category_id: string }[]).map((row) => row.category_id),
      category,
    )
  ) {
    return fail("CATEGORY", "That job is outside the services you offer.");
  }

  const { data: offer, error } = await context.supabase
    .from("provider_offers")
    .insert({
      job_id: jobId,
      provider_id: context.user.id,
      message: parsed.data.message,
      indicative_price_pence: pricePence,
      estimated_timeframe: parsed.data.estimatedTimeframe?.trim() || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      return fail("DUPLICATE", "You have already sent an offer for this job.");
    }
    return fail("CREATE_FAILED", "We couldn't send that offer. Check your details and try again.");
  }

  if (job.status === "open") {
    const { error: jobError } = await context.supabase.rpc("mark_job_receiving_offers", {
      p_job_id: jobId,
    });

    if (jobError) {
      await context.supabase
        .from("provider_offers")
        .update({ status: "withdrawn" })
        .eq("id", offer.id);
      return fail("CREATE_FAILED", "We couldn't send that offer. Try again.");
    }
  }

  await writeAudit({
    actorId: context.user.id,
    action: "offer.created",
    entityType: "offer",
    entityId: offer.id,
    metadata: { job_id: jobId },
  });

  await emit("offer.created", {
    customerEmail: await getUserEmail(job.customer_id),
    providerName: context.providerProfile.display_name,
    jobTitle: job.title,
    jobId,
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/provide/jobs");
  revalidatePath("/provide/offers");
  revalidatePath("/admin/offers");

  // The redirect happens on the server, so it does not depend on the browser
  // being ready to navigate.
  redirect(`/jobs/${jobId}?offer=sent`);
}

export async function updateOffer(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireApprovedProvider();
  const id = formData.get("id")?.toString() ?? "";
  const parsed = offerSchema.safeParse({
    message: formData.get("message"),
    price: formData.get("price")?.toString(),
    estimatedTimeframe: formData.get("estimatedTimeframe")?.toString(),
  });

  if (!id) return fail("NOT_FOUND", "That offer could not be found.");
  if (!parsed.success) return fromZodError(parsed.error);

  const pricePence = parsePricePence(parsed.data.price);
  if (pricePence === undefined) {
    return fail("PRICE", "Enter a price in pounds, or leave it blank.", {
      price: "Enter a price in pounds, or leave it blank.",
    });
  }

  const { data: offer } = await context.supabase
    .from("provider_offers")
    .select("id, provider_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!offer || offer.provider_id !== context.user.id) {
    return fail("NOT_FOUND", "That offer could not be found.");
  }

  if (offer.status !== "submitted") {
    return fail("LOCKED", "You can only edit an offer before the customer decides.");
  }

  const { error } = await context.supabase
    .from("provider_offers")
    .update({
      message: parsed.data.message,
      indicative_price_pence: pricePence,
      estimated_timeframe: parsed.data.estimatedTimeframe?.trim() || null,
    })
    .eq("id", id);

  if (error) return fail("SAVE_FAILED", "We couldn't save that offer. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "offer.updated",
    entityType: "offer",
    entityId: id,
  });

  revalidatePath("/provide/offers");
  return ok(undefined);
}

export async function withdrawOffer(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireApprovedProvider();
  const id = formData.get("id")?.toString() ?? "";

  const { data: offer } = await context.supabase
    .from("provider_offers")
    .select("id, provider_id, status, job_id")
    .eq("id", id)
    .maybeSingle();

  if (!offer || offer.provider_id !== context.user.id) {
    return fail("NOT_FOUND", "That offer could not be found.");
  }

  if (offer.status !== "submitted") {
    return fail("LOCKED", "That offer can no longer be withdrawn.");
  }

  const { error } = await context.supabase
    .from("provider_offers")
    .update({ status: "withdrawn" })
    .eq("id", id);

  if (error) return fail("SAVE_FAILED", "We couldn't withdraw that offer. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "offer.withdrawn",
    entityType: "offer",
    entityId: id,
    metadata: { job_id: offer.job_id },
  });

  revalidatePath("/provide/offers");
  revalidatePath(`/jobs/${offer.job_id}`);
  return ok(undefined);
}

export async function acceptOffer(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/jobs");
  const offerId = formData.get("offerId")?.toString() ?? "";

  if (!offerId) return fail("NOT_FOUND", "That offer could not be found.");

  const { data: offer } = await context.supabase
    .from("provider_offers")
    .select(
      "id, job_id, provider_id, status, provider_profiles(display_name), job_requests!provider_offers_job_id_fkey(id, title, customer_id)",
    )
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) return fail("NOT_FOUND", "That offer could not be found.");

  const job = offer.job_requests as unknown as {
    id: string;
    title: string;
    customer_id: string;
  } | null;

  if (!job || job.customer_id !== context.user.id) {
    return fail("NOT_FOUND", "That offer could not be found.");
  }

  if (offer.status !== "submitted") {
    return fail("LOCKED", "That offer is no longer open.");
  }

  const { data: otherOffers } = await context.supabase
    .from("provider_offers")
    .select("id, provider_id")
    .eq("job_id", offer.job_id)
    .eq("status", "submitted")
    .neq("id", offerId);

  const { error } = await context.supabase.rpc("accept_offer", {
    p_offer_id: offerId,
  });

  if (error) {
    return fail("ACCEPT_FAILED", "We couldn't accept that offer. Refresh and try again.");
  }

  const provider = offer.provider_profiles as unknown as {
    display_name: string;
  } | null;
  const providerEmail = await getUserEmail(offer.provider_id);
  const declined = (otherOffers ?? []) as { id: string; provider_id: string }[];
  const emails = await getUserEmails(declined.map((row) => row.provider_id));

  await emit("offer.accepted", {
    providerEmail,
    providerName: provider?.display_name ?? "there",
    jobTitle: job.title,
    jobId: job.id,
  });

  for (const row of declined) {
    await emit("offer.declined", {
      providerEmail: emails.get(row.provider_id) ?? null,
      jobTitle: job.title,
    });
  }

  await writeAudit({
    actorId: context.user.id,
    action: "offer.accepted",
    entityType: "offer",
    entityId: offerId,
    metadata: { job_id: offer.job_id },
  });

  revalidatePath(`/jobs/${offer.job_id}`);
  revalidatePath("/jobs");
  revalidatePath("/provide/offers");
  revalidatePath("/provide/jobs");
  revalidatePath("/admin/offers");

  return ok(undefined);
}

export async function declineOffer(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/jobs");
  const offerId = formData.get("offerId")?.toString() ?? "";

  if (!offerId) return fail("NOT_FOUND", "That offer could not be found.");

  const { data: offer } = await context.supabase
    .from("provider_offers")
    .select(
      "id, job_id, provider_id, status, provider_profiles(display_name), job_requests!provider_offers_job_id_fkey(id, title, customer_id)",
    )
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) return fail("NOT_FOUND", "That offer could not be found.");

  const job = offer.job_requests as unknown as {
    id: string;
    title: string;
    customer_id: string;
  } | null;
  if (!job || job.customer_id !== context.user.id || offer.status !== "submitted") {
    return fail("NOT_FOUND", "That offer could not be found.");
  }

  const { error } = await context.supabase
    .from("provider_offers")
    .update({ status: "declined" })
    .eq("id", offerId);

  if (error) return fail("SAVE_FAILED", "We couldn't decline that offer. Try again.");

  await writeAudit({
    actorId: context.user.id,
    action: "offer.declined",
    entityType: "offer",
    entityId: offerId,
    metadata: { job_id: offer.job_id },
  });

  await emit("offer.declined", {
    providerEmail: await getUserEmail(offer.provider_id),
    jobTitle: job.title,
  });

  revalidatePath(`/jobs/${offer.job_id}`);
  revalidatePath("/provide/offers");
  return ok(undefined);
}
