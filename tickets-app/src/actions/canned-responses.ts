"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getActiveOrgWithRole } from "@/lib/org-context";
import { listActiveCannedResponses } from "@/lib/queries/canned-responses";

const schema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(5000),
});

export type CannedResponseState = {
  error?: string;
  fieldErrors?: { title?: string; body?: string };
};

export async function createCannedResponse(
  orgSlug: string,
  _prev: CannedResponseState,
  formData: FormData,
): Promise<CannedResponseState> {
  const { user, org } = await getActiveOrgWithRole(orgSlug, [
    Role.AGENT,
    Role.ADMIN,
  ]);

  const parsed = schema.safeParse({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: CannedResponseState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "title" | "body";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  await db.cannedResponse.create({
    data: {
      orgId: org.id,
      title: parsed.data.title,
      body: parsed.data.body,
      createdBy: user.id,
    },
  });

  revalidatePath(`/app/${orgSlug}/canned-responses`);
  return {};
}

export async function updateCannedResponse(
  orgSlug: string,
  id: string,
  _prev: CannedResponseState,
  formData: FormData,
): Promise<CannedResponseState> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.AGENT, Role.ADMIN]);

  const parsed = schema.safeParse({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: CannedResponseState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "title" | "body";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  await db.cannedResponse.update({
    where: { id, orgId: org.id },
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
    },
  });

  revalidatePath(`/app/${orgSlug}/canned-responses`);
  return {};
}

export async function deleteCannedResponse(
  orgSlug: string,
  id: string,
  _formData: FormData,
): Promise<void> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.AGENT, Role.ADMIN]);

  await db.cannedResponse.delete({
    where: { id, orgId: org.id },
  });

  revalidatePath(`/app/${orgSlug}/canned-responses`);
}

export async function getCannedResponsesForOrg(): Promise<
  { id: string; title: string; body: string }[]
> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const m = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { orgId: true, role: true },
  });
  if (!m || m.role === Role.CUSTOMER) return [];
  return listActiveCannedResponses(m.orgId);
}
