"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setDashboardCookie } from "@/lib/dashboard-cookie";
import {
  availableDashboards,
  isActiveDashboard,
  requireUser,
} from "@/lib/permissions";
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
    phone: formData.get("phone") ?? "",
  });

  if (!parsed.success) return fromZodError(parsed.error);

  // Never write the name here. Even a forged form submission cannot change it:
  // the database trigger rejects name edits from non-admins.
  const { error } = await context.supabase
    .from("profiles")
    .update({ phone: nullIfBlank(parsed.data.phone) })
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

/**
 * Switch the dashboard an approved provider is currently viewing. The choice
 * is saved on the profile and in a cookie, so the proxy and server components
 * agree even while the hosted database lacks the new column.
 */
export async function switchDashboard(formData: FormData) {
  const context = await requireUser("/account");
  const target = formData.get("dashboard");
  const allowed = availableDashboards(context);

  if (!isActiveDashboard(target) || !allowed.includes(target)) {
    redirect("/account?error=dashboard-switch");
  }

  const { error } = await context.supabase
    .from("profiles")
    .update({ active_dashboard: target })
    .eq("id", context.user.id);

  // Before the hosted migration runs, the column is absent. PostgREST reports
  // that as 42703 on reads and PGRST204 on writes; the cookie keeps the switch
  // working in both cases. Any other write failure is still a real error.
  const missingColumn =
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    error?.message.includes("active_dashboard");
  if (error && !missingColumn) {
    redirect("/account?error=dashboard-switch");
  }

  await setDashboardCookie(context.user.id, target);

  revalidatePath("/account");
  revalidatePath("/jobs");
  revalidatePath("/post-job");
  revalidatePath("/provide");

  redirect(target === "provider" ? "/provide" : "/search");
}
