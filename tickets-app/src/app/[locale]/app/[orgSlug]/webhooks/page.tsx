import { setRequestLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getActiveOrg } from "@/lib/org-context";
import { db } from "@/lib/db";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import { WebhookForm } from "@/components/settings/webhook-form";
import { WebhookList } from "@/components/settings/webhook-list";

function formatDate(date: Date | null, locale: string) {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function WebhooksPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { org, membership } = await getActiveOrg(orgSlug);

  if (membership.role !== Role.ADMIN) {
    redirect(`/app/${orgSlug}/settings`);
  }

  const t = await getTranslations("Webhooks");

  const [webhooks, recentDeliveries] = await Promise.all([
    db.webhook.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
    }),
    db.webhookDelivery.findMany({
      where: { webhook: { orgId: org.id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { webhook: { select: { id: true, url: true } } },
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <WebhookForm orgSlug={orgSlug} events={WEBHOOK_EVENTS} />

      <WebhookList
        orgSlug={orgSlug}
        webhooks={webhooks.map((w) => ({
          id: w.id,
          url: w.url,
          events: w.events,
          active: w.active,
          lastCalledAt: formatDate(w.lastCalledAt, locale),
          lastError: w.lastError,
        }))}
      />

      <div className="space-y-2">
        <h2 className="font-semibold">{t("recentDeliveries")}</h2>
        <ul className="space-y-1 text-sm">
          {recentDeliveries.length === 0 ? (
            <li className="text-muted-foreground">{t("noDeliveries")}</li>
          ) : (
            recentDeliveries.map((d) => (
              <li
                key={d.id}
                className="bg-muted/40 flex items-center justify-between rounded-md px-3 py-1.5"
              >
                <span className="truncate">
                  <span className="font-mono text-xs">{d.event}</span>{" "}
                  <span className="text-muted-foreground">→</span>{" "}
                  <span className="truncate text-xs">{d.webhook.url}</span>
                </span>
                <span
                  className={
                    d.statusCode && d.statusCode < 300
                      ? "text-success text-xs"
                      : "text-destructive text-xs"
                  }
                >
                  {d.statusCode ?? "—"} {d.error ?? ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
