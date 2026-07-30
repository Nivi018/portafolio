import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DashboardStats } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ProjectsChart } from "@/components/dashboard/projects-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { TeamWorkload } from "@/components/dashboard/team-workload"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.orgId) {
    redirect("/login")
  }

  const orgId = session.user.orgId

  // Fetch stats
  const [
    totalClients,
    activeProjects,
    pendingTasks,
    totalInvoices,
    paidInvoices,
    overdueInvoices,
    activeTimers,
    recentActivity,
    upcomingTasks,
    teamMembers,
  ] = await Promise.all([
    prisma.client.count({ where: { orgId } }),
    prisma.project.count({ where: { orgId, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { project: { orgId }, status: { not: "DONE" } } }),
    prisma.invoice.findMany({ where: { project: { orgId } } }),
    prisma.invoice.findMany({ where: { project: { orgId }, status: "PAID" } }),
    prisma.invoice.findMany({ where: { project: { orgId }, status: "OVERDUE" } }),
    prisma.timeEntry.findMany({ where: { project: { orgId }, isRunning: true } }),
    prisma.activityLog.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: true },
    }),
    prisma.task.findMany({
      where: {
        project: { orgId },
        status: { not: "DONE" },
        dueDate: { not: null },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: { project: true, assignee: true },
    }),
    prisma.user.findMany({
      where: { orgId },
      include: {
        assignedTasks: {
          where: { status: { not: "DONE" } },
        },
        timeEntries: {
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
        },
      },
    }),
  ])

  // Calculate totals
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const pendingAmount = totalInvoices
    .filter((inv) => inv.status === "SENT")
    .reduce((sum, inv) => sum + inv.total, 0)
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)

  // Calculate hours this week
  const hoursThisWeek = teamMembers.reduce((sum, member) => {
    const memberHours = member.timeEntries.reduce((entrySum, entry) => {
      return entrySum + (entry.duration || 0)
    }, 0)
    return sum + memberHours
  }, 0) / 3600

  // Get project status distribution
  const projectsByStatus = await prisma.project.groupBy({
    by: ["status"],
    where: { orgId },
    _count: true,
  })

  // Get monthly revenue for last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const monthlyInvoices = await prisma.invoice.findMany({
    where: {
      project: { orgId },
      status: "PAID",
      paidDate: { gte: sixMonthsAgo },
    },
    select: { total: true, paidDate: true },
  })

  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const month = date.toLocaleString("default", { month: "short" })

    const revenue = monthlyInvoices
      .filter((inv) => {
        const invDate = new Date(inv.paidDate!)
        return (
          invDate.getMonth() === date.getMonth() &&
          invDate.getFullYear() === date.getFullYear()
        )
      })
      .reduce((sum, inv) => sum + inv.total, 0)

    return { month, revenue }
  })

  const stats = {
    totalRevenue,
    monthlyRevenue: monthlyRevenue[5]?.revenue || 0,
    pendingAmount,
    overdueAmount,
    activeProjects,
    pendingTasks,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
    totalClients,
    overdueInvoices: overdueInvoices.length,
    activeTimers: activeTimers.length,
  }

  const projectStatusData = projectsByStatus.map((item) => ({
    status: item.status,
    count: item._count,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}! Here&apos;s an overview of your business.
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart data={monthlyRevenue} />
        <ProjectsChart data={projectStatusData} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <RecentActivity activities={recentActivity} />
        <UpcomingTasks tasks={upcomingTasks} />
        <TeamWorkload members={teamMembers} />
      </div>
    </div>
  )
}
