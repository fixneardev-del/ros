"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/permissions";
import { ok } from "@/lib/actions/result";
import type { ActionResult } from "@/lib/actions/result";
import {
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationPreferences,
} from "@/lib/notifications";

const preferenceSchema = z.object({
  emailEnabled: z.boolean(),
  jobUpdates: z.boolean(),
  offerUpdates: z.boolean(),
});

export async function markRead(formData: FormData) {
  const context = await requireUser("/account/notifications");
  const id = formData.get("id")?.toString() ?? "";

  if (id) {
    await markNotificationRead(context.user.id, id);
    revalidatePath("/account/notifications");
    // The unread badge lives in the customer layout, so refresh that too.
    revalidatePath("/account", "layout");
    revalidatePath("/account");
  }
}

export async function markAllRead() {
  const context = await requireUser("/account/notifications");
  await markAllNotificationsRead(context.user.id);
  revalidatePath("/account/notifications");
  revalidatePath("/account", "layout");
  revalidatePath("/account");
}

export async function updateNotificationPreferencesAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/account/notifications");
  const parsed = preferenceSchema.safeParse({
    emailEnabled: formData.get("emailEnabled") === "on",
    jobUpdates: formData.get("jobUpdates") === "on",
    offerUpdates: formData.get("offerUpdates") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Check the form and try again." },
    };
  }

  const saved = await saveNotificationPreferences(
    context.user.id,
    parsed.data,
  );

  if (!saved) {
    return {
      ok: false,
      error: {
        code: "SAVE_FAILED",
        message: "We couldn't save your notification settings. Try again.",
      },
    };
  }

  revalidatePath("/account/notifications");
  return ok(undefined);
}
