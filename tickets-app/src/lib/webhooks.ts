import crypto from "node:crypto";
import { db } from "@/lib/db";

/**
 * Known webhook events. Keep this list in sync with the Webhook
 * documentation in the README.
 */
export const WEBHOOK_EVENTS = [
  "ticket.created",
  "ticket.updated",
  "reply.created",
  "ticket.assigned",
  "status.changed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

type DispatchArgs = {
  orgId: string;
  event: WebhookEvent;
  payload: unknown;
};

function sign(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Find active webhooks for the given org subscribed to this event and
 * fire-and-forget POST each. Failures are recorded in
 * WebhookDelivery for the admin to inspect.
 */
export async function dispatchWebhook({
  orgId,
  event,
  payload,
}: DispatchArgs): Promise<void> {
  const webhooks = await db.webhook.findMany({
    where: { orgId, active: true, events: { has: event } },
    select: { id: true, url: true, secret: true },
  });
  if (webhooks.length === 0) return;

  const body = JSON.stringify({
    event,
    deliveredAt: new Date().toISOString(),
    data: payload,
  });

  await Promise.allSettled(
    webhooks.map(async (wh) => {
      const signature = sign(wh.secret, body);
      try {
        const res = await fetch(wh.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-tickets-app-event": event,
            "x-tickets-app-signature": `sha256=${signature}`,
          },
          body,
          // Short timeout; webhook receivers should be quick.
          signal: AbortSignal.timeout(10_000),
        });
        const text = await res.text().catch(() => "");
        await db.webhookDelivery.create({
          data: {
            webhookId: wh.id,
            event,
            payload: payload as object,
            statusCode: res.status,
            response: text.slice(0, 1000),
            error: res.ok ? null : `HTTP ${res.status}`,
          },
        });
        await db.webhook.update({
          where: { id: wh.id },
          data: {
            lastCalledAt: new Date(),
            lastError: res.ok ? null : `HTTP ${res.status}`,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await db.webhookDelivery.create({
          data: {
            webhookId: wh.id,
            event,
            payload: payload as object,
            error: msg,
          },
        });
        await db.webhook.update({
          where: { id: wh.id },
          data: { lastError: msg.slice(0, 500), lastCalledAt: new Date() },
        });
      }
    }),
  );
}
