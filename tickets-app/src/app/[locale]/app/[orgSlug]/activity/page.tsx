import { setRequestLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { ActivityAction } from "@prisma/client";
import { getActiveOrg } from "@/lib/org-context";
import { listActivity, listActivityActors } from "@/lib/queries/notifications";
import { ActivityFilters } from "@/components/settings/activity-filters";

function formatDateTime(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const ACTION_LABELS: Record<string, string> = {
  TICKET_CREATED: "Ticket created",
  TICKET_ASSIGNED: "Ticket assigned",
  TICKET_UNASSIGNED: "Ticket unassigned",
  STATUS_CHANGED: "Status changed",
  PRIORITY_CHANGED: "Priority changed",
  REPLY_ADDED: "Reply added",
  INTERNAL_NOTE_ADDED: "Internal note added",
  TAG_ADDED: "Tag added",
  TAG_REMOVED: "Tag removed",
  TICKET_REOPENED: "Ticket reopened",
  TICKET_RESOLVED: "Ticket resolved",
  TICKET_CLOSED: "Ticket closed",
  MEMBER_INVITED: "Member invited",
  MEMBER_JOINED: "Member joined",
  MEMBER_REMOVED: "Member removed",
  ROLE_CHANGED: "Role changed",
};

const VALID_ACTIONS = new Set<string>(Object.keys(ACTION_LABELS));

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{
    actor?: string;
    action?: string;
    days?: string;
  }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { org, membership } = await getActiveOrg(orgSlug);

  if (membership.role === Role.CUSTOMER) {
    redirect(`/app/${orgSlug}/tickets`);
  }

  const sp = await searchParams;
  const actorId = sp.actor || undefined;
  const actionRaw = sp.action;
  const action =
    actionRaw && VALID_ACTIONS.has(actionRaw)
      ? (actionRaw as ActivityAction)
      : undefined;
  const daysRaw = sp.days ? Number(sp.days) : NaN;
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : undefined;

  const t = await getTranslations("Activity");

  const [items, actors] = await Promise.all([
    listActivity(
      org.id,
      {
        ...(actorId && { actorId }),
        ...(action && { action }),
        ...(days && { days }),
      },
      200,
    ),
    listActivityActors(org.id),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <ActivityFilters actors={actors} />

      <ol className="space-y-3">
        {items.length === 0 ? (
          <li className="text-muted-foreground text-sm">{t("empty")}</li>
        ) : (
          items.map((item) => {
            const meta = item.metadata as Record<string, unknown> | null;
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-lg border p-3 text-sm"
              >
                <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {(item.actorName ?? item.actorEmail)
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <p>
                    <span className="font-medium">
                      {item.actorName ?? item.actorEmail}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {ACTION_LABELS[item.action] ?? item.action}
                    </span>
                  </p>
                  {meta ? (
                    <p className="text-muted-foreground text-xs">
                      {Object.entries(meta)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(" · ")}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDateTime(item.createdAt, locale)}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ol>
    </div>
  );
}
