import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type ActiveOrg = NonNullable<
  Awaited<ReturnType<typeof getActiveOrgRaw>>
>;

async function getActiveOrgRaw(orgSlug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { kind: "unauthenticated" as const };
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: session.user.id,
      org: { slug: orgSlug },
    },
    include: {
      org: true,
      user: true,
    },
  });

  if (!membership) {
    return { kind: "no_membership" as const, userId: session.user.id };
  }

  return {
    kind: "ok" as const,
    user: membership.user,
    org: membership.org,
    membership,
  };
}

/**
 * Get the active organization for the current request.
 * Redirects to /sign-in if unauthenticated, /onboarding if no memberships,
 * and 404s if the org doesn't exist or the user is not a member.
 */
export async function getActiveOrg(orgSlug: string) {
  const result = await getActiveOrgRaw(orgSlug);

  if (result.kind === "unauthenticated") {
    redirect("/sign-in");
  }

  if (result.kind === "no_membership") {
    redirect("/onboarding");
  }

  return {
    user: result.user,
    org: result.org,
    membership: result.membership,
  };
}

/**
 * Get the active organization and require the user to have one of the allowed roles.
 * Redirects to the org dashboard if the role is not allowed.
 */
export async function getActiveOrgWithRole(
  orgSlug: string,
  allowedRoles: Role[],
) {
  const ctx = await getActiveOrg(orgSlug);

  if (!allowedRoles.includes(ctx.membership.role)) {
    redirect(`/app/${ctx.org.slug}`);
  }

  return ctx;
}

/**
 * Check if a role is allowed without redirecting.
 */
export function hasRole(
  membership: { role: Role },
  allowedRoles: Role[],
): boolean {
  return allowedRoles.includes(membership.role);
}

/**
 * Convenience: get the first org the user belongs to, or null if none.
 * Used for post-login/onboarding redirects.
 */
export async function getFirstOrgSlug(userId: string): Promise<string | null> {
  const membership = await db.membership.findFirst({
    where: { userId },
    include: { org: true },
    orderBy: { joinedAt: "asc" },
  });
  return membership?.org.slug ?? null;
}

/**
 * Get all memberships for a user (for the org switcher).
 */
export async function getUserMemberships(userId: string) {
  return db.membership.findMany({
    where: { userId },
    include: { org: true },
    orderBy: { joinedAt: "asc" },
  });
}
