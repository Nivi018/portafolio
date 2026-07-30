"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
} from "@/lib/queries/notifications";

export async function markOneRead(notificationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await markNotificationRead(session.user.id, notificationId);
  revalidatePath("/", "layout");
}

export async function markAllRead(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await markAllNotificationsRead(session.user.id);
  revalidatePath("/", "layout");
}

export async function refreshUnread(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return unreadNotificationCount(session.user.id);
}
