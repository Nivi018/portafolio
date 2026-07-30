import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const TRASH_SELECT = {
  id: true,
  subject: true,
  status: true,
  priority: true,
  createdAt: true,
  deletedAt: true,
  customer: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TicketSelect;

export type TrashItem = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  deletedAt: Date | null;
  customer: { id: string; name: string | null; email: string };
  assignee: { id: string; name: string | null; email: string } | null;
};

export async function listTrash(
  orgId: string,
  limit = 100,
): Promise<TrashItem[]> {
  return db.ticket.findMany({
    where: { orgId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: limit,
    select: TRASH_SELECT,
  });
}
