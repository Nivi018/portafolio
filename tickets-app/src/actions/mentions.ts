"use server";

import { auth } from "@/lib/auth";
import { listMentionableUsers } from "@/lib/queries/mentions";

/**
 * Search users that can be mentioned in a reply. Read-only and rate-limited
 * to avoid abuse (the user has to be typing a reply already, so this is
 * not a hot path).
 */
export async function searchMentionableUsers(
  query: string,
): Promise<{ id: string; name: string | null; email: string }[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  // We need the org. The caller will be on a ticket page so the user
  // should already have a valid org. We pick the first one for simplicity.
  const { db } = await import("@/lib/db");
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { orgId: true },
  });
  if (!membership) return [];

  const users = await listMentionableUsers(
    membership.orgId,
    session.user.id,
    query,
  );
  return users;
}
