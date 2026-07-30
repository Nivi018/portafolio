"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getActiveOrgWithRole } from "@/lib/org-context";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";

const urlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://") || u.startsWith("http://localhost"), {
    message: "URL must be https:// or http://localhost (dev)",
  });

const schema = z.object({
  url: urlSchema,
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, "Select at least one event"),
});

export type WebhookState = {
  error?: string;
  fieldErrors?: { url?: string; events?: string };
  success?: boolean;
};

export async function createWebhook(
  orgSlug: string,
  _prev: WebhookState,
  formData: FormData,
): Promise<WebhookState> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);

  const events = formData.getAll("events").map(String);
  const parsed = schema.safeParse({
    url: String(formData.get("url") ?? ""),
    events,
  });
  if (!parsed.success) {
    const fieldErrors: WebhookState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "url" | "events";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  await db.webhook.create({
    data: {
      orgId: org.id,
      url: parsed.data.url,
      events: parsed.data.events,
      secret: randomBytes(32).toString("hex"),
      active: true,
    },
  });

  revalidatePath(`/app/${orgSlug}/webhooks`);
  return { success: true };
}

export async function deleteWebhook(
  orgSlug: string,
  id: string,
  _formData: FormData,
): Promise<void> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);
  await db.webhook.delete({ where: { id, orgId: org.id } });
  revalidatePath(`/app/${orgSlug}/webhooks`);
}

export async function toggleWebhook(
  orgSlug: string,
  id: string,
  _formData: FormData,
): Promise<void> {
  const { org } = await getActiveOrgWithRole(orgSlug, [Role.ADMIN]);
  const wh = await db.webhook.findFirst({
    where: { id, orgId: org.id },
    select: { id: true, active: true },
  });
  if (!wh) return;
  await db.webhook.update({
    where: { id: wh.id },
    data: { active: !wh.active },
  });
  revalidatePath(`/app/${orgSlug}/webhooks`);
}
