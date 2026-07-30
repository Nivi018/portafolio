import { Prisma, Role, Status } from "@prisma/client";
import { db } from "@/lib/db";

export type PendingRatingItem = {
  ticketId: string;
  subject: string;
  resolvedAt: Date;
  orgSlug: string;
};

/**
 * Returns up to 5 resolved tickets the user owns that don't have a rating yet.
 * Used to drive the global CSAT banner in the app layout.
 */
export async function listPendingRatings(
  orgId: string,
  userId: string,
  role: Role,
): Promise<PendingRatingItem[]> {
  if (role !== Role.CUSTOMER) return [];

  const where: Prisma.TicketWhereInput = {
    orgId,
    customerId: userId,
    status: Status.RESOLVED,
    deletedAt: null,
    rating: null,
  };

  const tickets = await db.ticket.findMany({
    where,
    select: {
      id: true,
      subject: true,
      resolvedAt: true,
      org: { select: { slug: true } },
    },
    orderBy: { resolvedAt: "desc" },
    take: 5,
  });

  return tickets.map((t) => ({
    ticketId: t.id,
    subject: t.subject,
    resolvedAt: t.resolvedAt ?? new Date(),
    orgSlug: t.org.slug,
  }));
}
