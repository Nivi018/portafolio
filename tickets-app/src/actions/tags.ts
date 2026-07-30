"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getActiveOrgWithRole } from "@/lib/org-context";

const colorRegex = /^#([0-9a-fA-F]{6})$/;

const tagSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .trim()
    .regex(colorRegex, "Color must be a 6-digit hex code")
    .or(z.literal(""))
    .optional(),
});

export type TagState = {
  error?: string;
  fieldErrors?: { name?: string; color?: string };
};

export async function createTag(
  orgSlug: string,
  _prev: TagState,
  formData: FormData,
): Promise<TagState> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);

  const parsed = tagSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    color: String(formData.get("color") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: TagState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "color";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const existing = await db.tag.findFirst({
    where: { orgId: org.id, name: parsed.data.name },
    select: { id: true },
  });
  if (existing) {
    return { fieldErrors: { name: "A tag with this name already exists" } };
  }

  await db.tag.create({
    data: {
      orgId: org.id,
      name: parsed.data.name,
      color: parsed.data.color || "#6b7280",
    },
  });

  revalidatePath(`/app/${orgSlug}/tags`);
  return {};
}

export async function updateTag(
  orgSlug: string,
  tagId: string,
  _prev: TagState,
  formData: FormData,
): Promise<TagState> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);

  const parsed = tagSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    color: String(formData.get("color") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: TagState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "color";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  await db.tag.update({
    where: { id: tagId, orgId: org.id },
    data: {
      name: parsed.data.name,
      color: parsed.data.color || "#6b7280",
    },
  });

  revalidatePath(`/app/${orgSlug}/tags`);
  return {};
}

export async function deleteTag(
  orgSlug: string,
  tagId: string,
  _formData: FormData,
): Promise<void> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);

  await db.tag.delete({
    where: { id: tagId, orgId: org.id },
  });

  revalidatePath(`/app/${orgSlug}/tags`);
}
