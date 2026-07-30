"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isValidSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(40)
    .refine(
      isValidSlug,
      "Slug can only contain lowercase letters, numbers and hyphens",
    ),
});

export type CreateOrgState = {
  error?: string;
  fieldErrors?: { name?: string; slug?: string };
};

const RESERVED_SLUGS = new Set([
  "www",
  "api",
  "admin",
  "app",
  "dashboard",
  "sign-in",
  "sign-up",
  "onboarding",
  "join",
  "new",
  "settings",
  "tickets",
  "billing",
  "help",
  "support",
  "docs",
  "static",
  "public",
  "assets",
]);

export async function createOrganization(
  _prev: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to create an organization" };
  }

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase(),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: CreateOrgState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "slug";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, slug } = parsed.data;

  if (RESERVED_SLUGS.has(slug)) {
    return { fieldErrors: { slug: "This slug is reserved" } };
  }

  const existing = await db.organization.findUnique({ where: { slug } });
  if (existing) {
    return { fieldErrors: { slug: "This slug is already taken" } };
  }

  const existingMembership = await db.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (existingMembership) {
    redirect("/");
  }

  const org = await db.organization.create({
    data: {
      name,
      slug,
      memberships: {
        create: {
          userId: session.user.id,
          role: "ADMIN",
          joinedAt: new Date(),
        },
      },
    },
  });

  redirect(`/app/${org.slug}`);
}
