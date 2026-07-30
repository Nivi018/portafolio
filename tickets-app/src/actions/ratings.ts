"use server";

import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/org-context";
import { createRatingSchema } from "@/lib/validators/rating";

export type CreateRatingState = {
  error?: string;
  fieldErrors?: { score?: string; comment?: string };
  success?: boolean;
};

export async function createRating(
  orgSlug: string,
  ticketId: string,
  _prev: CreateRatingState,
  formData: FormData,
): Promise<CreateRatingState> {
  const { user, org } = await getActiveOrg(orgSlug);

  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, orgId: org.id, deletedAt: null },
    select: { id: true, status: true, customerId: true, rating: true },
  });
  if (!ticket) return { error: "Ticket not found" };

  // Only the ticket's customer can rate it.
  if (ticket.customerId !== user.id) {
    return { error: "Only the ticket creator can rate it" };
  }

  // Only resolved tickets can be rated.
  if (ticket.status !== Status.RESOLVED) {
    return { error: "You can only rate resolved tickets" };
  }

  if (ticket.rating) {
    return { error: "This ticket has already been rated" };
  }

  const parsed = createRatingSchema.safeParse({
    score: formData.get("score"),
    comment: String(formData.get("comment") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: CreateRatingState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "score" | "comment";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  await db.rating.create({
    data: {
      ticketId: ticket.id,
      userId: user.id,
      score: parsed.data.score,
      comment: parsed.data.comment || null,
    },
  });

  revalidatePath(`/app/${orgSlug}/tickets/${ticketId}`);
  return { success: true };
}
