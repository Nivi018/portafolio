import { ActivityAction, NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { triggerUser } from "@/lib/pusher-server";

const NOTIFICATION_PAGE_SIZE = 20;

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: Date;
};

export async function listNotifications(
  userId: string,
): Promise<NotificationItem[]> {
  return db.notification.findMany({
    where: { userId },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      read: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: NOTIFICATION_PAGE_SIZE,
  });
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, read: false },
  });
}

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  ticketId?: string;
};

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  const notif = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      ticketId: input.ticketId,
    },
    select: { id: true, read: true },
  });

  await triggerUser(input.userId, "notification:new", {
    id: notif.id,
    title: input.title,
    body: input.body,
    link: input.link,
  });
  await triggerUser(input.userId, "notification:count", {
    unread: await unreadNotificationCount(input.userId),
  });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  await db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
  await triggerUser(userId, "notification:count", {
    unread: await unreadNotificationCount(userId),
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  await triggerUser(userId, "notification:count", { unread: 0 });
}

// =============================================================================
// Activity log
// =============================================================================

export type CreateActivityInput = {
  orgId: string;
  actorId: string;
  action: ActivityAction;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function createActivity(
  input: CreateActivityInput,
): Promise<void> {
  await db.activityLog.create({
    data: {
      orgId: input.orgId,
      actorId: input.actorId,
      action: input.action,
      entityId: input.entityId ?? null,
      metadata: input.metadata
        ? (input.metadata as object as never)
        : undefined,
    },
  });
}

export type ActivityItem = {
  id: string;
  action: ActivityAction;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
  actorId: string;
  actorName: string | null;
  actorEmail: string;
};

export type ActivityFilters = {
  actorId?: string;
  action?: ActivityAction;
  days?: number;
};

export async function listActivity(
  orgId: string,
  filters: ActivityFilters = {},
  limit = 50,
): Promise<ActivityItem[]> {
  const where: Prisma.ActivityLogWhereInput = { orgId };
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.action) where.action = filters.action;
  if (filters.days && filters.days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - filters.days);
    where.createdAt = { gte: since };
  }

  const rows = await db.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const actorIds = Array.from(new Set(rows.map((r) => r.actorId)));
  const actors = await db.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, email: true },
  });
  const actorMap = new Map(actors.map((a) => [a.id, a]));
  return rows.map((r) => {
    const a = actorMap.get(r.actorId);
    return {
      id: r.id,
      action: r.action,
      entityId: r.entityId,
      metadata: r.metadata,
      createdAt: r.createdAt,
      actorId: r.actorId,
      actorName: a?.name ?? null,
      actorEmail: a?.email ?? "",
    };
  });
}

export async function listActivityActors(orgId: string) {
  // Distinct actors that have activity in this org
  const rows = await db.activityLog.findMany({
    where: { orgId },
    select: { actorId: true },
    distinct: ["actorId"],
    take: 50,
  });
  const actorIds = rows.map((r) => r.actorId);
  if (actorIds.length === 0) return [];
  return db.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, email: true },
  });
}
