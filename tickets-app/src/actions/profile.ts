"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { signOutAction } from "@/actions/auth";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name must be at most 80 characters"),
  preferredLocale: z.enum(["en", "es"]),
});

export type ProfileState = {
  error?: string;
  fieldErrors?: { name?: string; preferredLocale?: string };
  success?: boolean;
};

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    preferredLocale: String(formData.get("preferredLocale") ?? "en"),
  });
  if (!parsed.success) {
    const fieldErrors: ProfileState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "preferredLocale";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      preferredLocale: parsed.data.preferredLocale,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export { signOutAction };

export type DeleteAccountState = { error?: string };

/**
 * GDPR / right-to-be-forgotten.
 *
 * Customers (and only customers, by default) can delete their own account.
 * Staff must go through an org admin.
 *
 * What gets deleted:
 *   - Account, Session, VerificationToken rows
 *   - Membership rows
 *   - Tickets they created (via cascade)
 *   - Replies they authored
 *   - Notifications they received
 *   - Ratings they gave
 *
 * Their User record is also deleted; their email is freed for re-registration.
 */
export async function deleteOwnAccount(): Promise<DeleteAccountState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  // Refuse to delete accounts that are the last admin of an org.
  const adminMemberships = await db.membership.findMany({
    where: { userId: session.user.id, role: Role.ADMIN },
    select: {
      orgId: true,
      org: { select: { name: true } },
    },
  });
  for (const m of adminMemberships) {
    const otherAdmins = await db.membership.count({
      where: {
        orgId: m.orgId,
        role: Role.ADMIN,
        userId: { not: session.user.id },
      },
    });
    if (otherAdmins === 0) {
      return {
        error: `You are the last admin of "${m.org.name}". Transfer ownership before deleting your account.`,
      };
    }
  }

  // Cascading deletes (set on the schema) handle tickets, replies, etc.
  // We sign out *before* deleting the user to avoid token issues.
  await signOut({ redirectTo: "/" });
  await db.user.delete({ where: { id: session.user.id } });

  return {};
}
