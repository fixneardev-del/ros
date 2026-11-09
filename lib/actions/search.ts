"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { normalisePostcode, postcodeDistrict } from "@/lib/postcode";
import { checkRateLimit } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/schemas/search";
import { fail, ok } from "@/lib/actions/result";
import { emit } from "@/lib/events";

export async function checkPostcode(input: string) {
  const normalised = normalisePostcode(input);
  const district = normalised ? postcodeDistrict(normalised) : null;

  if (!normalised || !district) {
    return { valid: false as const, district: null, inPilot: false as const };
  }

  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("locations")
      .select("id")
      .eq("postcode_district", district)
      .eq("is_enabled", true)
      .maybeSingle();

    return { valid: true as const, district, inPilot: Boolean(data) };
  } catch {
    return { valid: true as const, district, inPilot: false as const };
  }
}

export async function joinWaitlist(
  _previous: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = waitlistSchema.safeParse({
    email: formData.get("email"),
    postcode: formData.get("postcode"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const normalised = normalisePostcode(parsed.data.postcode);
  if (!normalised) {
    return { ok: false, error: "Enter a Glasgow postcode like G12 8QQ." };
  }

  const limit = checkRateLimit(`waitlist:${parsed.data.email.toLowerCase()}`, 3, 60 * 60 * 1000);
  if (!limit.allowed) {
    return { ok: false, error: "You have already asked to be notified. We will be in touch." };
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("interest_signups").insert({
      email: parsed.data.email,
      postcode: normalised,
    });

    if (error) {
      return { ok: false, error: "We couldn't save that. Check your connection and try again." };
    }

    await emit("waitlist.joined", {
      adminEmail: getServerEnv().adminEmail,
      signupEmail: parsed.data.email,
      postcode: normalised,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "We couldn't save that. Check your connection and try again." };
  }
}

export async function validatePostcodeForAction(input: string) {
  const normalised = normalisePostcode(input);
  if (!normalised) return fail("POSTCODE", "Enter a Glasgow postcode like G12 8QQ.");

  const district = postcodeDistrict(normalised);
  if (!district) return fail("POSTCODE", "Enter a Glasgow postcode like G12 8QQ.");

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("locations")
    .select("id")
    .eq("postcode_district", district)
    .eq("is_enabled", true)
    .maybeSingle();

  if (!data) {
    return fail(
      "OUT_OF_PILOT",
      `We're not in ${district} yet. We're starting in Glasgow's West End and selected university communities.`,
    );
  }

  return ok({ postcode: normalised, district });
}
