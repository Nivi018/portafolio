import { Role } from "@prisma/client";

/**
 * Centralized permission checks. Always derive permissions from the user's
 * membership role in the active organization — never from raw IDs alone.
 */

const ROLE_RANK: Record<Role, number> = {
  CUSTOMER: 1,
  AGENT: 2,
  ADMIN: 3,
};

export function isAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export const can = {
  manageOrg: (role: Role) => isAtLeast(role, "ADMIN"),
  manageMembers: (role: Role) => isAtLeast(role, "ADMIN"),
  viewAllTickets: (role: Role) => isAtLeast(role, "AGENT"),
  assignTickets: (role: Role) => isAtLeast(role, "AGENT"),
  changeTicketStatus: (role: Role) => isAtLeast(role, "AGENT"),
  createInternalNotes: (role: Role) => isAtLeast(role, "AGENT"),
  viewReports: (role: Role) => isAtLeast(role, "ADMIN"),
  manageTags: (role: Role) => isAtLeast(role, "ADMIN"),
  manageCannedResponses: (role: Role) => isAtLeast(role, "AGENT"),
  editOrgSettings: (role: Role) => isAtLeast(role, "ADMIN"),
};

/**
 * Check if a user can view a specific ticket.
 * Customers can only see their own tickets.
 * Agents and admins can see all tickets in their org.
 */
export function canViewTicket(
  role: Role,
  userId: string,
  ticket: { customerId: string; assigneeId: string | null },
): boolean {
  if (can.viewAllTickets(role)) return true;
  return ticket.customerId === userId || ticket.assigneeId === userId;
}
