import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/tickets/status-badge";
import { LoadMore } from "@/components/layout/load-more";
import { getActiveOrg } from "@/lib/org-context";
import { listTickets } from "@/lib/queries/tickets";

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    dateStyle: "medium",
  }).format(date);
}

export default async function MyTicketsPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { user, org, membership } = await getActiveOrg(orgSlug);

  const t = await getTranslations("MyTickets");

  const { items, nextCursor } = await listTickets({
    orgId: org.id,
    userId: user.id,
    role: membership.role,
    filters: { mine: true },
  });

  return (
    <div className="space-y-6">
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
                {t("columns.created")}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
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
                    {formatDate(ticket.createdAt, locale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LoadMore
        nextHref={
          nextCursor ? `/app/${orgSlug}/my-tickets?cursor=${nextCursor}` : null
        }
        label={t("loadMore")}
      />
    </div>
  );
}
