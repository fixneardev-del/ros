"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { accountSchema, passwordChangeSchema } from "@/lib/schemas/account";
import { fail, fromZodError, ok } from "@/lib/actions/result";
import type { ActionResult } from "@/lib/actions/result";
import { nullIfBlank } from "@/lib/schemas/common";

export async function updateAccount(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/account");
  const parsed = accountSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await context.supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: nullIfBlank(parsed.data.phone),
    })
    .eq("id", context.user.id);

  if (error) {
    return fail("SAVE_FAILED", "We couldn't save your details. Check your connection and try again.");
  }

  revalidatePath("/account");
  return ok(undefined);
}

export async function changePassword(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/account");
  const parsed = passwordChangeSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await context.supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return fail("PASSWORD_FAILED", "We couldn't update your password. Sign in again and retry.");
  }

  return ok(undefined);
}
