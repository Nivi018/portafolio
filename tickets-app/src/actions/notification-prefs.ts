"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  notifyEmailReplies: z.coerce.boolean().optional(),
  notifyEmailMentions: z.coerce.boolean().optional(),
  notifyEmailStatus: z.coerce.boolean().optional(),
  notifyEmailCsat: z.coerce.boolean().optional(),
  notifyEmailAssign: z.coerce.boolean().optional(),
});

export type NotificationPrefsState = {
  error?: string;
  success?: boolean;
};

export async function updateNotificationPrefs(
  _prev: NotificationPrefsState,
  formData: FormData,
): Promise<NotificationPrefsState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const parsed = schema.safeParse({
    notifyEmailReplies: formData.get("notifyEmailReplies") === "on",
    notifyEmailMentions: formData.get("notifyEmailMentions") === "on",
    notifyEmailStatus: formData.get("notifyEmailStatus") === "on",
    notifyEmailCsat: formData.get("notifyEmailCsat") === "on",
    notifyEmailAssign: formData.get("notifyEmailAssign") === "on",
  });

  if (!parsed.success) {
    return { error: "Invalid preferences" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  revalidatePath("/");
  return { success: true };
}
