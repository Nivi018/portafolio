"use server";

import { revalidatePath } from "next/cache";
import { Role, Status } from "@prisma/client";
import { db } from "@/lib/db";
import { getActiveOrgWithRole } from "@/lib/org-context";

export type TrashState = { error?: string };

/**
 * Restore a soft-deleted ticket. Admin-only.
 */
export async function restoreTicket(
  orgSlug: string,
  ticketId: string,
  _formData: FormData,
): Promise<TrashState> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);

  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, orgId: org.id, deletedAt: { not: null } },
    select: { id: true, status: true },
  });
  if (!ticket) return { error: "Ticket not found in trash" };

  // When restoring, reset to OPEN so it appears in the normal queue.
  await db.ticket.update({
    where: { id: ticket.id },
    data: {
      deletedAt: null,
      status: Status.OPEN,
      resolvedAt: null,
    },
  });

  revalidatePath(`/app/${orgSlug}/trash`);
  revalidatePath(`/app/${orgSlug}/tickets`);
  return {};
}

/**
 * Permanently delete a soft-deleted ticket. Admin-only.
 * Cascades through the Prisma schema, so replies and attachments go too.
 */
export async function purgeTicket(
  orgSlug: string,
  ticketId: string,
  _formData: FormData,
): Promise<TrashState> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);

  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, orgId: org.id, deletedAt: { not: null } },
    select: { id: true },
  });
  if (!ticket) return { error: "Ticket not found in trash" };

  // We do not use delete() because the relations use SetNull/onDelete:
  // Cascade instead. Instead, hard-delete with `delete` which
  // triggers Prisma's referential actions.
  await db.ticket.delete({ where: { id: ticket.id } });

  revalidatePath(`/app/${orgSlug}/trash`);
  return {};
}
