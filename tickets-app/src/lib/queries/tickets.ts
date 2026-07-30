import { Prisma, Priority, Status, Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canViewTicket } from "@/lib/permissions";

const PAGE_SIZE = 20;

export type TicketListItem = {
  id: string;
  subject: string;
  status: Status;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  customer: { id: string; name: string | null; email: string };
  assignee: { id: string; name: string | null; email: string } | null;
};

export type ListTicketsFilters = {
  status?: Status | null;
  priority?: Priority | null;
  search?: string | null;
  mine?: boolean;
};

export type ListTicketsResult = {
  items: TicketListItem[];
  nextCursor: string | null;
};

type ListTicketsArgs = {
  orgId: string;
  userId: string;
  role: Role;
  filters: ListTicketsFilters;
  cursor?: string | null;
};

const TICKET_LIST_SELECT = {
  id: true,
  subject: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TicketSelect;

export async function listTickets({
  orgId,
  userId,
  role,
  filters,
  cursor,
}: ListTicketsArgs): Promise<ListTicketsResult> {
  const where: Prisma.TicketWhereInput = {
    orgId,
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;

  if (filters.search) {
    where.subject = { contains: filters.search, mode: "insensitive" };
  }

  if (role === Role.CUSTOMER || filters.mine) {
    where.customerId = userId;
  }

  const items = await db.ticket.findMany({
    where,
    select: TICKET_LIST_SELECT,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > PAGE_SIZE;
  const trimmed = hasMore ? items.slice(0, PAGE_SIZE) : items;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;

  return { items: trimmed, nextCursor };
}

export type TicketDetail = NonNullable<
  Awaited<ReturnType<typeof getTicketRaw>>
>;

const TICKET_DETAIL_SELECT = {
  id: true,
  subject: true,
  description: true,
  status: true,
  priority: true,
  orgId: true,
  customerId: true,
  assigneeId: true,
  firstResponseAt: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  customer: { select: { id: true, name: true, email: true, image: true } },
  assignee: {
    select: { id: true, name: true, email: true, image: true },
  },
  org: { select: { id: true, slug: true, name: true } },
  rating: { select: { id: true, score: true, comment: true } },
} satisfies Prisma.TicketSelect;

async function getTicketRaw(orgId: string, ticketId: string) {
  return db.ticket.findFirst({
    where: { id: ticketId, orgId, deletedAt: null },
    select: TICKET_DETAIL_SELECT,
  });
}

/**
 * Get a single ticket. Validates that the user is allowed to view it:
 * - Agents and admins can view any ticket in their org.
 * - Customers can only view tickets they created or are assigned to them.
 * Throws notFound() if the ticket doesn't exist or the user can't see it.
 */
export async function getTicket(
  orgId: string,
  ticketId: string,
  userId: string,
  role: Role,
) {
  const ticket = await getTicketRaw(orgId, ticketId);
  if (!ticket) notFound();

  if (!canViewTicket(role, userId, ticket)) {
    notFound();
  }

  return ticket;
}
