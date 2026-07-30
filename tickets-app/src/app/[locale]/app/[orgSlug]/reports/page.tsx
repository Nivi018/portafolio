import { setRequestLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getActiveOrg } from "@/lib/org-context";
import {
  getAgentPerformance,
  getPriorityBreakdown,
  getStatusBreakdown,
  getTicketsOverTime,
} from "@/lib/queries/metrics";
import {
  AgentPerformanceChart,
  PriorityBreakdownChart,
  StatusBreakdownChart,
  TicketsOverTimeChart,
} from "@/components/dashboard/charts";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";

const ALLOWED_RANGES = [7, 14, 30, 90] as const;

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { org, membership } = await getActiveOrg(orgSlug);

  if (membership.role === Role.CUSTOMER) {
    redirect(`/app/${orgSlug}/tickets`);
  }

  const sp = await searchParams;
  const days = Math.max(
    1,
    ALLOWED_RANGES.includes(Number(sp.days) as (typeof ALLOWED_RANGES)[number])
      ? Number(sp.days)
      : 14,
  );

  const t = await getTranslations("Reports");

  const [status, priority, overTime, agents] = await Promise.all([
    getStatusBreakdown(org.id),
    getPriorityBreakdown(org.id),
    getTicketsOverTime(org.id, days),
    getAgentPerformance(org.id, days),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <DateRangePicker
          current={days}
          options={ALLOWED_RANGES}
          orgSlug={orgSlug}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusBreakdownChart
          data={status.map((s) => ({ status: s.status, count: s.count }))}
        />
        <PriorityBreakdownChart
          data={priority.map((p) => ({ priority: p.priority, count: p.count }))}
        />
        <TicketsOverTimeChart
          data={overTime.map((p) => ({ date: p.date, count: p.count }))}
          days={days}
        />
        {membership.role === Role.ADMIN ? (
          <AgentPerformanceChart
            data={agents.map((a) => ({
              name: a.name ?? a.email,
              email: a.email,
              assigned: a.assigned,
              resolved: a.resolved,
              open: a.open,
            }))}
            days={days}
          />
        ) : (
          <div className="bg-card text-muted-foreground rounded-lg border p-4 text-sm">
            {t("adminOnly")}
          </div>
        )}
      </div>
    </div>
  );
}
