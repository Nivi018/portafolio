import { setRequestLocale, getTranslations } from "next-intl/server";
import { Status, Priority, Role } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { SavedViewsMenu } from "@/components/tickets/saved-views-menu";
import { StatusBadge, PriorityBadge } from "@/components/tickets/status-badge";
import { LoadMore } from "@/components/layout/load-more";
import { TicketListRealtimeListener } from "@/components/realtime/ticket-list-realtime-listener";
import { getActiveOrg } from "@/lib/org-context";
import { listTickets } from "@/lib/queries/tickets";

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    dateStyle: "medium",
  }).format(date);
}

function parseStatus(value: string | undefined): Status | null {
  if (!value) return null;
  if ((Object.values(Status) as string[]).includes(value)) {
    return value as Status;
  }
  return null;
}

function parsePriority(value: string | undefined): Priority | null {
  if (!value) return null;
  if ((Object.values(Priority) as string[]).includes(value)) {
    return value as Priority;
  }
  return null;
}

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    mine?: string;
    cursor?: string;
  }>;
}) {
  const { locale, orgSlug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const { user, org, membership } = await getActiveOrg(orgSlug);

  const t = await getTranslations("Tickets.list");

  const { items, nextCursor } = await listTickets({
    orgId: org.id,
    userId: user.id,
    role: membership.role,
    filters: {
      status: parseStatus(sp.status),
      priority: parsePriority(sp.priority),
      search: sp.q ?? null,
      mine: sp.mine === "1",
    },
    cursor: sp.cursor ?? null,
  });

  const showMineToggle = membership.role !== Role.CUSTOMER;

  return (
    <div className="space-y-6">
      <TicketListRealtimeListener orgId={org.id} currentUserId={user.id} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <Link
          href={`/app/${orgSlug}/tickets/new`}
          className={buttonVariants({ variant: "default" })}
        >
          {t("newTicket")}
        </Link>
        <a
          href={`/api/tickets/export?orgSlug=${orgSlug}&${sp.status ? `status=${sp.status}&` : ""}${sp.priority ? `priority=${sp.priority}&` : ""}${sp.q ? `q=${encodeURIComponent(sp.q)}&` : ""}${sp.mine ? `mine=1&` : ""}`}
          className={buttonVariants({ variant: "outline" })}
          download
        >
          {t("exportCsv")}
        </a>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <TicketFilters showMineToggle={showMineToggle} />
        <SavedViewsMenu
          currentParams={{
            q: sp.q ?? "",
            status: sp.status ?? "",
            priority: sp.priority ?? "",
            mine: sp.mine ?? "",
          }}
        />
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.subject")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.status")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.priority")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.customer")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.created")}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              items.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-muted/30 border-t transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/${orgSlug}/tickets/${ticket.id}`}
                      className="font-medium hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {ticket.customer.name ?? ticket.customer.email}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {formatDate(ticket.createdAt, locale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LoadMore
        nextHref={buildNextHref(
          {
            q: sp.q,
            status: sp.status,
            priority: sp.priority,
            mine: sp.mine,
          },
          nextCursor,
          orgSlug,
        )}
        label={t("loadMore")}
      />
    </div>
  );
}

function buildNextHref(
  sp: { q?: string; status?: string; priority?: string; mine?: string },
  nextCursor: string | null,
  orgSlug: string,
): string | null {
  if (!nextCursor) return null;
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.status) params.set("status", sp.status);
  if (sp.priority) params.set("priority", sp.priority);
  if (sp.mine) params.set("mine", sp.mine);
  params.set("cursor", nextCursor);
  return `/app/${orgSlug}/tickets?${params.toString()}`;
}
