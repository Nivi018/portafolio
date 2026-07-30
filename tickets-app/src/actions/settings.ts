"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getActiveOrgWithRole } from "@/lib/org-context";
import { isValidSlug } from "@/lib/slug";

const updateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .refine(
      isValidSlug,
      "Slug can only contain lowercase letters, numbers and hyphens",
    ),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color must be a 6-digit hex code")
    .or(z.literal(""))
    .optional(),
  logo: z
    .string()
    .trim()
    .url("Logo must be a valid URL")
    .or(z.literal(""))
    .optional(),
});

export type UpdateOrgSettingsState = {
  error?: string;
  fieldErrors?: {
    name?: string;
    slug?: string;
    primaryColor?: string;
    logo?: string;
  };
  success?: boolean;
};

export async function updateOrgSettings(
  orgSlug: string,
  _prev: UpdateOrgSettingsState,
  formData: FormData,
): Promise<UpdateOrgSettingsState> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);

  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase(),
    primaryColor: String(formData.get("primaryColor") ?? ""),
    logo: String(formData.get("logo") ?? ""),
  };

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: UpdateOrgSettingsState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "slug" | "primaryColor" | "logo";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  // If slug is changing, ensure it doesn't conflict.
  if (parsed.data.slug !== org.slug) {
    const existing = await db.organization.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    });
    if (existing) {
      return { fieldErrors: { slug: "This slug is already taken" } };
    }
  }

  await db.organization.update({
    where: { id: org.id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      primaryColor: parsed.data.primaryColor || null,
      logo: parsed.data.logo || null,
    },
  });

  revalidatePath(`/app/${orgSlug}/settings`);
  revalidatePath(`/app/${parsed.data.slug}`, "layout");
  return { success: true };
}
