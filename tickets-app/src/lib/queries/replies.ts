import { Prisma, Role, TicketReply } from "@prisma/client";
import { db } from "@/lib/db";
import { canViewTicket } from "@/lib/permissions";

const REPLY_SELECT = {
  id: true,
  body: true,
  isInternal: true,
  createdAt: true,
  author: { select: { id: true, name: true, email: true, image: true } },
} satisfies Prisma.TicketReplySelect;

export type ReplyListItem = Pick<
  TicketReply,
  "id" | "body" | "isInternal" | "createdAt"
> & {
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export type ReplyListResult = {
  items: ReplyListItem[];
  /** Lowercased emails + names of authors so the client can highlight mentions. */
  knownUsernames: string[];
};

/**
 * List replies for a ticket, filtered by what the user is allowed to see.
 * Customers don't see internal notes. Staff see everything.
 */
export async function listTicketReplies(
  ticketId: string,
  userId: string,
  role: Role,
): Promise<ReplyListResult> {
  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, deletedAt: null },
    select: { id: true, customerId: true, assigneeId: true },
  });
  if (!ticket) return { items: [], knownUsernames: [] };
  if (!canViewTicket(role, userId, ticket)) {
    return { items: [], knownUsernames: [] };
  }

  const where: Prisma.TicketReplyWhereInput = {
    ticketId,
    deletedAt: null,
  };
  if (role === Role.CUSTOMER) {
    where.isInternal = false;
  }

  const items = await db.ticketReply.findMany({
    where,
    select: REPLY_SELECT,
    orderBy: { createdAt: "asc" },
  });

  // Build a set of all authors' names + emails so the client can
  // highlight @mentions of anyone who's already in the conversation.
  const usernames = new Set<string>();
  for (const r of items) {
    if (r.author.email) usernames.add(r.author.email.toLowerCase());
    if (r.author.name) {
      usernames.add(r.author.name.toLowerCase());
      // "Firstname Lastname" → "firstname.lastname" for slug-style mentions
      const dotName = r.author.name
        .toLowerCase()
        .replace(/\s+/g, ".")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      usernames.add(dotName);
    }
  }
  // Also include all org members so they're mentionable.
  const members = await db.membership
    .findMany({
      where: { orgId: ticket.customerId ? await getOrgId(ticketId) : "" },
      include: { user: { select: { email: true, name: true } } },
    })
    .catch(() => [] as { user: { email: string; name: string | null } }[]);
  for (const m of members) {
    if (m.user.email) usernames.add(m.user.email.toLowerCase());
    if (m.user.name) {
      usernames.add(m.user.name.toLowerCase());
      usernames.add(
        m.user.name
          .toLowerCase()
          .replace(/\s+/g, ".")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      );
    }
  }

  return { items, knownUsernames: Array.from(usernames) };
}

async function getOrgId(ticketId: string): Promise<string> {
  const t = await db.ticket.findFirst({
    where: { id: ticketId },
    select: { orgId: true },
  });
  return t?.orgId ?? "";
}
