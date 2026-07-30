"use server";

import { revalidatePath } from "next/cache";
import { NotificationType, Role, Status } from "@prisma/client";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/org-context";
import { canViewTicket } from "@/lib/permissions";
import { triggerOrg } from "@/lib/pusher-server";
import { sendEmail } from "@/lib/email/send";
import { renderReplyEmail } from "@/lib/email/templates";
import { createNotification } from "@/lib/queries/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { parseMentions } from "@/lib/mentions";
import { findUsersByUsernames } from "@/lib/queries/mentions";
import { dispatchWebhook } from "@/lib/webhooks";
import { createReplySchema } from "@/lib/validators/reply";

export type CreateReplyState = {
  error?: string;
  fieldErrors?: { body?: string };
  success?: boolean;
};

export async function createReply(
  orgSlug: string,
  ticketId: string,
  _prev: CreateReplyState,
  formData: FormData,
): Promise<CreateReplyState> {
  const { user, org, membership } = await getActiveOrg(orgSlug);

  // 30 replies per user per minute
  const rl = rateLimit(`createReply:${user.id}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return { error: "You're replying too fast. Please wait a moment." };
  }

  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, orgId: org.id, deletedAt: null },
    select: {
      id: true,
      status: true,
      customerId: true,
      assigneeId: true,
    },
  });
  if (!ticket) return { error: "Ticket not found" };

  if (!canViewTicket(membership.role, user.id, ticket)) {
    return { error: "You are not allowed to reply to this ticket" };
  }

  const parsed = createReplySchema.safeParse({
    body: String(formData.get("body") ?? ""),
    isInternal: formData.get("isInternal") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: CreateReplyState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "body";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  // Only agents/admins can post internal notes.
  const isInternal =
    parsed.data.isInternal &&
    (membership.role === Role.AGENT || membership.role === Role.ADMIN);

  // Customer replying to a RESOLVED or CLOSED ticket reopens it.
  let newStatus: Status | null = null;
  let resolvedAt: Date | null | undefined = undefined;
  if (
    membership.role === Role.CUSTOMER &&
    (ticket.status === Status.RESOLVED || ticket.status === Status.CLOSED)
  ) {
    newStatus = Status.OPEN;
    resolvedAt = null;
  }

  await db.$transaction([
    db.ticketReply.create({
      data: {
        ticketId: ticket.id,
        authorId: user.id,
        body: parsed.data.body,
        isInternal,
      },
    }),
    ...(newStatus
      ? [
          db.ticket.update({
            where: { id: ticket.id },
            data: { status: newStatus, resolvedAt },
          }),
        ]
      : []),
  ]);

  await triggerOrg(org.id, "reply:created", {
    ticketId: ticket.id,
    reply: {
      authorId: user.id,
      authorName: user.name,
      isInternal,
    },
  });

  // Webhook delivery (best-effort).
  if (!isInternal) {
    void dispatchWebhook({
      orgId: org.id,
      event: "reply.created",
      payload: {
        ticketId: ticket.id,
        reply: {
          authorId: user.id,
          authorName: user.name,
        },
      },
    });
  }

  // Email the other side (and the assignee if staff) for public replies.
  // Internal notes do not trigger customer emails or notifications.
  if (!isInternal) {
    const recipients = new Set<string>();
    if (ticket.customerId !== user.id) {
      const customer = await db.user.findUnique({
        where: { id: ticket.customerId },
        select: {
          email: true,
          preferredLocale: true,
          notifyEmailReplies: true,
        },
      });
      if (customer?.email && customer.notifyEmailReplies) {
        recipients.add(customer.email);
      }
    }
    // Notify the assignee if they're a staff member who didn't write the reply.
    if (ticket.assigneeId && ticket.assigneeId !== user.id) {
      const assigneeUser = await db.user.findUnique({
        where: { id: ticket.assigneeId },
        select: {
          email: true,
          preferredLocale: true,
          notifyEmailReplies: true,
        },
      });
      // Only email staff, not customers.
      if (assigneeUser?.email) {
        const isStaff = await db.membership.findFirst({
          where: {
            userId: ticket.assigneeId,
            orgId: org.id,
            role: { in: [Role.AGENT, Role.ADMIN] },
          },
        });
        if (isStaff && assigneeUser.notifyEmailReplies) {
          recipients.add(assigneeUser.email);
        }
      }
    }

    // In-app notifications for the same audience.
    if (ticket.customerId !== user.id) {
      await createNotification({
        userId: ticket.customerId,
        type: NotificationType.TICKET_REPLY,
        title: "New reply on your ticket",
        body: `${user.name ?? user.email ?? "Someone"} replied to your ticket`,
        link: `/${org.slug}/tickets/${ticket.id}`,
        ticketId: ticket.id,
      });
    }
    if (ticket.assigneeId && ticket.assigneeId !== user.id) {
      const isStaff = await db.membership.findFirst({
        where: {
          userId: ticket.assigneeId,
          orgId: org.id,
          role: { in: [Role.AGENT, Role.ADMIN] },
        },
      });
      if (isStaff) {
        await createNotification({
          userId: ticket.assigneeId,
          type: NotificationType.TICKET_REPLY,
          title: "New reply",
          body: `${user.name ?? user.email ?? "Someone"} replied to an assigned ticket`,
          link: `/${org.slug}/tickets/${ticket.id}`,
          ticketId: ticket.id,
        });
      }
    }

    if (recipients.size > 0) {
      const ticketRow = await db.ticket.findFirst({
        where: { id: ticket.id },
        select: { subject: true },
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const ticketUrl = `${appUrl}/${org.slug}/tickets/${ticket.id}`;
      for (const email of recipients) {
        const recipientUser = await db.user.findUnique({
          where: { email },
          select: { preferredLocale: true },
        });
        const locale = recipientUser?.preferredLocale === "es" ? "es" : "en";
        const tpl = renderReplyEmail({
          orgName: org.name,
          ticketSubject: ticketRow?.subject ?? "",
          authorName: user.name ?? user.email ?? "Someone",
          replyBody: parsed.data.body,
          ticketUrl,
          isInternal: false,
          locale,
        });
        await sendEmail({
          to: email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });
      }
    }

    // Mentions: notify any user whose email/handle appears in the body.
    const mentioned = parseMentions(parsed.data.body);
    if (mentioned.length > 0) {
      const ticketRow = await db.ticket.findFirst({
        where: { id: ticket.id },
        select: { subject: true },
      });
      const mentionedUsers = await findUsersByUsernames(org.id, mentioned);
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id === user.id) continue;
        // Only notify if the user can view the ticket.
        if (
          !canViewTicket(membership.role, mentionedUser.id, {
            customerId: ticket.customerId,
            assigneeId: ticket.assigneeId,
          })
        ) {
          continue;
        }
        await createNotification({
          userId: mentionedUser.id,
          type: NotificationType.MENTION,
          title: "You were mentioned",
          body: `${user.name ?? user.email ?? "Someone"} mentioned you in a reply on "${ticketRow?.subject ?? "a ticket"}"`,
          link: `/${org.slug}/tickets/${ticket.id}`,
          ticketId: ticket.id,
        });

        // Re-read with notification prefs (the previous select didn't include it)
        const prefs = await db.user.findUnique({
          where: { id: mentionedUser.id },
          select: { notifyEmailMentions: true },
        });
        if (prefs?.notifyEmailMentions) {
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
          const ticketUrl = `${appUrl}/${org.slug}/tickets/${ticket.id}`;
          // Reuse the reply template with a "you were mentioned" note
          const locale = "en"; // mentioned user's locale; we don't have it here
          const tpl = renderReplyEmail({
            orgName: org.name,
            ticketSubject: ticketRow?.subject ?? "",
            authorName: user.name ?? user.email ?? "Someone",
            replyBody: parsed.data.body,
            ticketUrl,
            isInternal: false,
            locale,
          });
          await sendEmail({
            to: mentionedUser.email,
            subject: tpl.subject,
            html: tpl.html,
            text: tpl.text,
          });
        }
      }
    }
  }

  revalidatePath(`/app/${orgSlug}/tickets/${ticketId}`);
  return {};
}

export async function deleteReply(
  orgSlug: string,
  ticketId: string,
  replyId: string,
): Promise<CreateReplyState> {
  const { user, membership } = await getActiveOrg(orgSlug);

  const reply = await db.ticketReply.findFirst({
    where: { id: replyId, ticketId, deletedAt: null },
    select: { id: true, authorId: true },
  });
  if (!reply) return { error: "Reply not found" };

  const isAuthor = reply.authorId === user.id;
  const isStaff =
    membership.role === Role.AGENT || membership.role === Role.ADMIN;

  if (!isAuthor && !isStaff) {
    return { error: "You can only delete your own replies" };
  }

  await db.ticketReply.update({
    where: { id: reply.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/app/${orgSlug}/tickets/${ticketId}`);
  return {};
}
