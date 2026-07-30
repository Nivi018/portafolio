import { Role, Status } from "@prisma/client";

/**
 * Status workflow:
 *   OPEN          → IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED
 *   IN_PROGRESS   → WAITING_CUSTOMER, RESOLVED, CLOSED, OPEN
 *   WAITING_CUSTOMER → IN_PROGRESS, RESOLVED, CLOSED
 *   RESOLVED      → CLOSED, OPEN (reopen)
 *   CLOSED        → OPEN (reopen, requires reason)
 */
const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: [
    Status.IN_PROGRESS,
    Status.WAITING_CUSTOMER,
    Status.RESOLVED,
    Status.CLOSED,
  ],
  IN_PROGRESS: [
    Status.WAITING_CUSTOMER,
    Status.RESOLVED,
    Status.CLOSED,
    Status.OPEN,
  ],
  WAITING_CUSTOMER: [Status.IN_PROGRESS, Status.RESOLVED, Status.CLOSED],
  RESOLVED: [Status.CLOSED, Status.OPEN],
  CLOSED: [Status.OPEN],
};

export function canTransition(from: Status, to: Status): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Reopening (CLOSED or RESOLVED → OPEN) requires a reason.
 */
export function requiresReason(from: Status, to: Status): boolean {
  return (
    (from === Status.CLOSED || from === Status.RESOLVED) && to === Status.OPEN
  );
}

/**
 * Whether the role is allowed to change status on a ticket.
 * - Customers can only move to CLOSED on their own tickets.
 * - Agents and admins can change to anything allowed by the workflow.
 */
export function canChangeStatus(
  role: Role,
  isCustomerTicket: boolean,
): boolean {
  if (role === Role.AGENT || role === Role.ADMIN) return true;
  // Customer can only act on their own ticket
  return isCustomerTicket;
}

/**
 * Whether the role is allowed to change priority or assignee.
 * Only agents and admins.
 */
export function canManageTicket(role: Role): boolean {
  return role === Role.AGENT || role === Role.ADMIN;
}
