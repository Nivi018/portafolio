import { Priority, Prisma, Role, Status } from "@prisma/client";
import { db } from "@/lib/db";

export type DashboardCounts = {
  open: number;
  inProgress: number;
  waitingCustomer: number;
  resolved: number;
  closed: number;
  total: number;
  myAssigned: number;
  myUnanswered: number;
  csatAverage: number | null;
  csatCount: number;
};

export async function getDashboardCounts(
  orgId: string,
  userId: string,
  role: Role,
): Promise<DashboardCounts> {
  const where: Prisma.TicketWhereInput = { orgId, deletedAt: null };
  const mineWhere: Prisma.TicketWhereInput = { ...where, customerId: userId };

  const baseFilter: Prisma.TicketWhereInput =
    role === Role.CUSTOMER ? mineWhere : where;

  const [
    open,
    inProgress,
    waiting,
    resolved,
    closed,
    total,
    mine,
    mineUnanswered,
    ratings,
  ] = await Promise.all([
    db.ticket.count({ where: { ...baseFilter, status: Status.OPEN } }),
    db.ticket.count({ where: { ...baseFilter, status: Status.IN_PROGRESS } }),
    db.ticket.count({
      where: { ...baseFilter, status: Status.WAITING_CUSTOMER },
    }),
    db.ticket.count({ where: { ...baseFilter, status: Status.RESOLVED } }),
    db.ticket.count({ where: { ...baseFilter, status: Status.CLOSED } }),
    db.ticket.count({ where: baseFilter }),
    db.ticket.count({
      where: {
        ...where,
        assigneeId: userId,
        deletedAt: null,
        status: { not: Status.CLOSED },
      },
    }),
    db.ticket.count({
      where: {
        ...where,
        assigneeId: userId,
        firstResponseAt: null,
        deletedAt: null,
      },
    }),
    db.rating.findMany({
      where: { ticket: { orgId } },
      select: { score: true },
    }),
  ]);

  const csatCount = ratings.length;
  const csatAverage =
    csatCount > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / csatCount
      : null;

  return {
    open,
    inProgress,
    waitingCustomer: waiting,
    resolved,
    closed,
    total,
    myAssigned: mine,
    myUnanswered: mineUnanswered,
    csatAverage,
    csatCount,
  };
}

export type StatusBreakdown = { status: Status; count: number };
export type PriorityBreakdown = { priority: Priority; count: number };
export type TimeSeriesPoint = { date: string; count: number };
export type AgentPerformance = {
  agentId: string;
  name: string | null;
  email: string;
  assigned: number;
  resolved: number;
  open: number;
};

export async function getStatusBreakdown(
  orgId: string,
): Promise<StatusBreakdown[]> {
  const groups = await db.ticket.groupBy({
    by: ["status"],
    where: { orgId, deletedAt: null },
    _count: { _all: true },
  });
  return groups.map((g) => ({
    status: g.status,
    count: g._count._all,
  }));
}

export async function getPriorityBreakdown(
  orgId: string,
): Promise<PriorityBreakdown[]> {
  const groups = await db.ticket.groupBy({
    by: ["priority"],
    where: { orgId, deletedAt: null },
    _count: { _all: true },
  });
  return groups.map((g) => ({
    priority: g.priority,
    count: g._count._all,
  }));
}

export async function getTicketsOverTime(
  orgId: string,
  days: number = 14,
): Promise<TimeSeriesPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await db.ticket.findMany({
    where: { orgId, deletedAt: null, createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

export async function getAgentPerformance(
  orgId: string,
  days: number = 30,
): Promise<AgentPerformance[]> {
  const memberships = await db.membership.findMany({
    where: { orgId, role: { in: [Role.AGENT, Role.ADMIN] } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const since = new Date();
  since.setDate(since.getDate() - days);

  const result: AgentPerformance[] = [];
  for (const m of memberships) {
    const [assigned, resolved, open] = await Promise.all([
      db.ticket.count({
        where: {
          orgId,
          assigneeId: m.userId,
          deletedAt: null,
          createdAt: { gte: since },
        },
      }),
      db.ticket.count({
        where: {
          orgId,
          assigneeId: m.userId,
          deletedAt: null,
          status: { in: [Status.RESOLVED, Status.CLOSED] },
          resolvedAt: { gte: since },
        },
      }),
      db.ticket.count({
        where: {
          orgId,
          assigneeId: m.userId,
          deletedAt: null,
          status: {
            in: [Status.OPEN, Status.IN_PROGRESS, Status.WAITING_CUSTOMER],
          },
        },
      }),
    ]);
    result.push({
      agentId: m.userId,
      name: m.user.name,
      email: m.user.email,
      assigned,
      resolved,
      open,
    });
  }
  return result;
}
