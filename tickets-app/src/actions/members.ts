"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getActiveOrgWithRole } from "@/lib/org-context";
import { can } from "@/lib/permissions";
import { sendEmail } from "@/lib/email/send";
import { renderOrgInviteEmail } from "@/lib/email/templates";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(Role, {
    message: "Please select a role",
  }),
});

export type InviteMemberState = {
  error?: string;
  fieldErrors?: { email?: string; role?: string };
  success?: { inviteUrl: string };
};

const INVITE_TOKEN_BYTES = 24;

export async function inviteMember(
  orgSlug: string,
  _prev: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
  const { user, org, membership } = await getActiveOrgWithRole(orgSlug, [
    Role.ADMIN,
  ]);
  if (!can.manageOrg(membership.role)) {
    return { error: "Only admins can invite members" };
  }

  const parsed = inviteSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    role: String(formData.get("role") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: InviteMemberState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "email" | "role";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  // Find or create the user by email. (User may not exist yet if invited.)
  let existingUser = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await db.membership.findFirst({
      where: { userId: existingUser.id, orgId: org.id },
    });
    if (existingMembership) {
      return { error: "This user is already a member of this organization" };
    }
  } else {
    // Create a placeholder user that will be linked to a real account on signup.
    const created = await db.user.create({
      data: { email: parsed.data.email },
      select: { id: true },
    });
    existingUser = { id: created.id };
  }

  const token = randomBytes(INVITE_TOKEN_BYTES).toString("base64url");

  await db.membership.create({
    data: {
      userId: existingUser.id,
      orgId: org.id,
      role: parsed.data.role,
      invitedBy: user.id,
      inviteToken: token,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/${org.slug}/join/${token}`;

  // Send the invite email. If the user already had an account, we still send
  // the invite — they can accept from any signed-in device.
  const locale = user.preferredLocale === "es" ? "es" : "en";
  const email = renderOrgInviteEmail({
    orgName: org.name,
    inviterName: user.name ?? user.email ?? "Someone",
    inviteUrl,
    locale,
  });
  await sendEmail({
    to: parsed.data.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  revalidatePath(`/app/${orgSlug}/settings/members`);

  return { success: { inviteUrl } };
}

const changeRoleSchema = z.nativeEnum(Role);

export async function changeMemberRole(
  orgSlug: string,
  membershipId: string,
  formData: FormData,
): Promise<void> {
  const { user, org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);

  const parsed = changeRoleSchema.safeParse(formData.get("role"));
  if (!parsed.success) throw new Error("Invalid role");

  const target = await db.membership.findFirst({
    where: { id: membershipId, orgId: org.id },
    select: { id: true, role: true, userId: true, orgId: true },
  });
  if (!target) throw new Error("Member not found");

  // Don't let the last admin demote themselves.
  if (target.role === Role.ADMIN && parsed.data !== Role.ADMIN) {
    const adminCount = await db.membership.count({
      where: { orgId: org.id, role: Role.ADMIN },
    });
    if (adminCount <= 1) throw new Error("Cannot remove the last admin");
    if (target.userId === user.id) {
      throw new Error("You cannot demote yourself as the last admin");
    }
  }

  await db.membership.update({
    where: { id: target.id },
    data: { role: parsed.data },
  });

  revalidatePath(`/app/${orgSlug}/settings/members`);
}

export async function removeMember(
  orgSlug: string,
  membershipId: string,
  _formData: FormData,
): Promise<void> {
  const { user, org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);

  const target = await db.membership.findFirst({
    where: { id: membershipId, orgId: org.id },
    select: { id: true, role: true, userId: true },
  });
  if (!target) throw new Error("Member not found");

  if (target.userId === user.id) {
    throw new Error("You cannot remove yourself");
  }

  if (target.role === Role.ADMIN) {
    const adminCount = await db.membership.count({
      where: { orgId: org.id, role: Role.ADMIN },
    });
    if (adminCount <= 1) throw new Error("Cannot remove the last admin");
  }

  // Unassign tickets that were assigned to the removed member.
  await db.$transaction([
    db.membership.delete({ where: { id: target.id } }),
    db.ticket.updateMany({
      where: { orgId: org.id, assigneeId: target.userId },
      data: { assigneeId: null },
    }),
  ]);

  revalidatePath(`/app/${orgSlug}/settings/members`);
}

const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

export type AcceptInviteState = { error?: string; orgSlug?: string };

export async function acceptInvite(
  _prev: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to accept an invite" };
  }

  const parsed = acceptInviteSchema.safeParse({
    token: String(formData.get("token") ?? ""),
  });
  if (!parsed.success) return { error: "Invalid token" };

  const membership = await db.membership.findUnique({
    where: { inviteToken: parsed.data.token },
    select: {
      id: true,
      userId: true,
      orgId: true,
      org: { select: { slug: true } },
      joinedAt: true,
    },
  });
  if (!membership) return { error: "Invite not found or already used" };

  // Transfer the membership to the signed-in user, or accept it directly.
  await db.membership.update({
    where: { id: membership.id },
    data: {
      userId: session.user.id,
      joinedAt: membership.joinedAt ?? new Date(),
      inviteToken: null,
    },
  });

  revalidatePath("/");
  return { orgSlug: membership.org.slug };
}
