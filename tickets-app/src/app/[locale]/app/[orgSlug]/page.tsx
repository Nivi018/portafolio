import { setRequestLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { getActiveOrg } from "@/lib/org-context";
import { getDashboardCounts } from "@/lib/queries/metrics";
import { KpiCard } from "@/components/dashboard/kpi-card";

function formatAverage(n: number | null): string {
  if (n === null) return "—";
  return `${n.toFixed(1)} / 5`;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { user, org, membership } = await getActiveOrg(orgSlug);

  const t = await getTranslations("Dashboard");

  const counts = await getDashboardCounts(org.id, user.id, membership.role);

  if (membership.role === Role.CUSTOMER) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("subtitleCustomer")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label={t("kpis.open")} value={counts.open} />
          <KpiCard label={t("kpis.inProgress")} value={counts.inProgress} />
          <KpiCard
            label={t("kpis.waitingCustomer")}
            value={counts.waitingCustomer}
          />
          <KpiCard label={t("kpis.resolved")} value={counts.resolved} />
        </div>
      </div>
    );
  }

  if (membership.role === Role.AGENT) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitleAgent")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label={t("kpis.myAssigned")} value={counts.myAssigned} />
          <KpiCard
            label={t("kpis.myUnanswered")}
            value={counts.myUnanswered}
            hint={t("kpis.myUnansweredHint")}
          />
          <KpiCard label={t("kpis.resolvedTotal")} value={counts.resolved} />
          <KpiCard
            label={t("kpis.csat")}
            value={formatAverage(counts.csatAverage)}
            hint={
              counts.csatCount > 0
                ? t("kpis.csatHint", { count: counts.csatCount })
                : t("kpis.csatEmpty")
            }
          />
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitleAdmin")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("kpis.totalOpen")}
          value={counts.open + counts.inProgress + counts.waitingCustomer}
        />
        <KpiCard
          label={t("kpis.resolvedTotal")}
          value={counts.resolved + counts.closed}
        />
        <KpiCard
          label={t("kpis.csat")}
          value={formatAverage(counts.csatAverage)}
          hint={
            counts.csatCount > 0
              ? t("kpis.csatHint", { count: counts.csatCount })
              : t("kpis.csatEmpty")
          }
        />
        <KpiCard label={t("kpis.totalAll")} value={counts.total} />
      </div>
    </div>
  );
}
