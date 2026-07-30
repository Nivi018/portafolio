"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NotificationType, Priority, Role, Status } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/org-context";
import { triggerOrg, triggerUser } from "@/lib/pusher-server";
import { sendEmail } from "@/lib/email/send";
import { renderAssignedEmail, renderCsatEmail } from "@/lib/email/templates";
import { createNotification } from "@/lib/queries/notifications";
import { createTicketSchema } from "@/lib/validators/ticket";
import { rateLimit } from "@/lib/rate-limit";
import { dispatchWebhook } from "@/lib/webhooks";
import {
  canChangeStatus,
  canManageTicket,
  canTransition,
  requiresReason,
} from "@/lib/ticket-workflow";

export type CreateTicketState = {
  error?: string;
  fieldErrors?: { subject?: string; description?: string; priority?: string };
};

export async function createTicket(
  orgSlug: string,
  _prev: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
  const { user, org } = await getActiveOrg(orgSlug);

  // 10 tickets per user per 5 minutes
  const rl = rateLimit(`createTicket:${user.id}`, {
    limit: 10,
    windowMs: 5 * 60_000,
  });
  if (!rl.ok) {
    return {
      error: "You're creating tickets too fast. Please wait a moment.",
    };
  }

  const raw = {
    subject: String(formData.get("subject") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    priority: String(formData.get("priority") ?? "MEDIUM"),
  };

  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: CreateTicketState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "subject" | "description" | "priority";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  // Read attachment URLs from a parallel "attachments" field (JSON-encoded
  // array of { url, name, size, mimeType }).
  const attachmentIdsRaw = String(formData.get("attachmentIds") ?? "");
  const attachmentIds = attachmentIdsRaw
    ? (JSON.parse(attachmentIdsRaw) as string[])
    : [];

  const ticket = await db.ticket.create({
    data: {
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority,
      orgId: org.id,
      customerId: user.id,
      attachments: {
        connect: attachmentIds.map((id) => ({ id })),
      },
    },
    select: { id: true },
  });

  await triggerOrg(org.id, "ticket:created", {
    ticketId: ticket.id,
    subject: parsed.data.subject,
  });

  // Fire webhook in the background (no await on the response).
  void dispatchWebhook({
    orgId: org.id,
    event: "ticket.created",
    payload: {
      ticket: {
        id: ticket.id,
        subject: parsed.data.subject,
        priority: parsed.data.priority,
        customerId: user.id,
      },
    },
  });

  revalidatePath(`/app/${orgSlug}/tickets`);
  redirect(`/app/${orgSlug}/tickets/${ticket.id}`);
}

// =============================================================================
// Update status / priority / assignee
// =============================================================================

export type UpdateTicketState = { error?: string };

const statusSchema = z.nativeEnum(Status);
const prioritySchema = z.nativeEnum(Priority);

export async function updateTicketStatus(
  orgSlug: string,
  ticketId: string,
  _prev: UpdateTicketState,
  formData: FormData,
): Promise<UpdateTicketState> {
  const { user, org, membership } = await getActiveOrg(orgSlug);

  const target = statusSchema.safeParse(formData.get("status"));
  if (!target.success) return { error: "Invalid status" };

  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, orgId: org.id, deletedAt: null },
    select: {
      id: true,
      status: true,
      customerId: true,
      firstResponseAt: true,
    },
  });
  if (!ticket) return { error: "Ticket not found" };

  const isCustomerTicket = ticket.customerId === user.id;
  if (!canChangeStatus(membership.role, isCustomerTicket)) {
    return { error: "You are not allowed to change the status of this ticket" };
  }

  if (!canTransition(ticket.status, target.data)) {
    return {
      error: `Cannot transition from ${ticket.status} to ${target.data}`,
    };
  }

  if (requiresReason(ticket.status, target.data)) {
    const reason = String(formData.get("reason") ?? "").trim();
    if (reason.length < 3) {
      return { error: "A reason is required to reopen a ticket" };
    }
  }

  // Customers reopening a closed/resolved ticket goes back to OPEN automatically.
  // We also use this for the explicit reopen case below.
  const now = new Date();
  const data: {
    status: Status;
    firstResponseAt?: Date;
    resolvedAt?: Date | null;
  } = { status: target.data };

  // Set firstResponseAt the first time an agent/admin moves the ticket
  // away from OPEN.
  if (
    !ticket.firstResponseAt &&
    (membership.role === Role.AGENT || membership.role === Role.ADMIN) &&
    ticket.status === Status.OPEN &&
    target.data !== Status.OPEN
  ) {
    data.firstResponseAt = now;
  }

  // Set/clear resolvedAt.
  if (target.data === Status.RESOLVED) {
    data.resolvedAt = now;
  } else if (ticket.status === Status.RESOLVED) {
    // Allowed transitions from RESOLVED are CLOSED or OPEN; both should clear
    // the resolvedAt marker since the ticket is no longer resolved.
    data.resolvedAt = null;
  }

  await db.ticket.update({
    where: { id: ticket.id },
    data,
  });

  await triggerOrg(org.id, "ticket:updated", {
    ticketId: ticket.id,
    changes: { status: target.data },
  });
  // Send a CSAT email and notification when the ticket transitions to RESOLVED.
  if (target.data === Status.RESOLVED && ticket.status !== Status.RESOLVED) {
    const fullTicket = await db.ticket.findFirst({
      where: { id: ticket.id },
      select: {
        subject: true,
        customer: {
          select: {
            email: true,
            name: true,
            preferredLocale: true,
            notifyEmailCsat: true,
          },
        },
      },
    });
    if (fullTicket?.customer.email && fullTicket.customer.notifyEmailCsat) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const rateUrl = `${appUrl}/${orgSlug}/tickets/${ticket.id}`;
      const locale = fullTicket.customer.preferredLocale === "es" ? "es" : "en";
      const tpl = renderCsatEmail({
        orgName: org.name,
        ticketSubject: fullTicket.subject,
        customerName: fullTicket.customer.name ?? fullTicket.customer.email,
        rateUrl,
        locale,
      });
      await sendEmail({
        to: fullTicket.customer.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
      await createNotification({
        userId: ticket.customerId,
        type: NotificationType.CSAT_REQUESTED,
        title: "How did we do?",
        body: "Your ticket was resolved — please rate your experience.",
        link: `/${orgSlug}/tickets/${ticket.id}`,
        ticketId: ticket.id,
      });
    }
  }
  revalidatePath(`/app/${orgSlug}/tickets`);
  revalidatePath(`/app/${orgSlug}/tickets/${ticketId}`);
  return {};
}

export async function updateTicketPriority(
  orgSlug: string,
  ticketId: string,
  _prev: UpdateTicketState,
  formData: FormData,
): Promise<UpdateTicketState> {
  const { org, membership } = await getActiveOrg(orgSlug);

  if (!canManageTicket(membership.role)) {
    return { error: "Only agents and admins can change priority" };
  }

  const target = prioritySchema.safeParse(formData.get("priority"));
  if (!target.success) return { error: "Invalid priority" };

  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, orgId: org.id, deletedAt: null },
    select: { id: true, priority: true },
  });
  if (!ticket) return { error: "Ticket not found" };

  if (ticket.priority === target.data) return {};

  await db.ticket.update({
    where: { id: ticket.id },
    data: { priority: target.data },
  });

  await triggerOrg(org.id, "ticket:updated", {
    ticketId: ticket.id,
    changes: { priority: target.data },
  });

  revalidatePath(`/app/${orgSlug}/tickets`);
  revalidatePath(`/app/${orgSlug}/tickets/${ticketId}`);
  return {};
}

export async function updateTicketAssignee(
  orgSlug: string,
  ticketId: string,
  _prev: UpdateTicketState,
  formData: FormData,
): Promise<UpdateTicketState> {
  const { org, membership } = await getActiveOrg(orgSlug);

  if (!canManageTicket(membership.role)) {
    return { error: "Only agents and admins can assign tickets" };
  }

  const rawAssignee = String(formData.get("assigneeId") ?? "").trim();
  const assigneeId = rawAssignee === "" ? null : rawAssignee;

  if (assigneeId) {
    const isMember = await db.membership.findFirst({
      where: {
        orgId: org.id,
        userId: assigneeId,
        role: { in: [Role.AGENT, Role.ADMIN] },
      },
      select: { id: true },
    });
    if (!isMember) return { error: "Assignee must be an agent or admin" };
  }

  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, orgId: org.id, deletedAt: null },
    select: { id: true, assigneeId: true },
  });
  if (!ticket) return { error: "Ticket not found" };

  if (ticket.assigneeId === assigneeId) return {};

  await db.ticket.update({
    where: { id: ticket.id },
    data: { assigneeId },
  });

  if (assigneeId) {
    await triggerUser(assigneeId, "ticket:assigned", { ticketId: ticket.id });

    // In-app notification.
    await createNotification({
      userId: assigneeId,
      type: NotificationType.TICKET_ASSIGNED,
      title: "Ticket assigned to you",
      body: `You were assigned a ticket`,
      link: `/${orgSlug}/tickets/${ticket.id}`,
      ticketId: ticket.id,
    });

    // Email the new assignee (if they have assignment emails enabled).
    const assignee = await db.user.findUnique({
      where: { id: assigneeId },
      select: {
        email: true,
        name: true,
        preferredLocale: true,
        notifyEmailAssign: true,
      },
    });
    const fullTicket = await db.ticket.findFirst({
      where: { id: ticket.id },
      select: { subject: true },
    });
    if (assignee?.email && assignee.notifyEmailAssign && fullTicket) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const ticketUrl = `${appUrl}/${orgSlug}/tickets/${ticket.id}`;
      const locale = assignee.preferredLocale === "es" ? "es" : "en";
      const tpl = renderAssignedEmail({
        orgName: org.name,
        ticketSubject: fullTicket.subject,
        assigneeName: assignee.name ?? assignee.email,
        ticketUrl,
        locale,
      });
      await sendEmail({
        to: assignee.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    }
  }
  await triggerOrg(org.id, "ticket:updated", {
    ticketId: ticket.id,
    changes: { assigneeId },
  });

  revalidatePath(`/app/${orgSlug}/tickets`);
  revalidatePath(`/app/${orgSlug}/tickets/${ticketId}`);
  return {};
}

export async function softDeleteTicket(
  orgSlug: string,
  ticketId: string,
): Promise<UpdateTicketState> {
  const { user, org, membership } = await getActiveOrg(orgSlug);

  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, orgId: org.id, deletedAt: null },
    select: { id: true, customerId: true },
  });
  if (!ticket) return { error: "Ticket not found" };

  // Customers can only delete their own tickets.
  if (membership.role === Role.CUSTOMER && ticket.customerId !== user.id) {
    return { error: "You can only delete your own tickets" };
  }

  await db.ticket.update({
    where: { id: ticket.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/app/${orgSlug}/tickets`);
  redirect(`/app/${orgSlug}/tickets`);
}
