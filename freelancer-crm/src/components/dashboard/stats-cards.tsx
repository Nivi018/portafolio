"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FolderKanban, CheckSquare, Clock, Users, AlertTriangle, Timer } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface DashboardStatsProps {
  stats: {
    totalRevenue: number
    monthlyRevenue: number
    activeProjects: number
    pendingTasks: number
    hoursThisWeek: number
    totalClients: number
    overdueInvoices: number
    activeTimers: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      description: `${formatCurrency(stats.monthlyRevenue)} this month`,
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects.toString(),
      description: "In progress",
      icon: FolderKanban,
      trend: "neutral",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks.toString(),
      description: "To be completed",
      icon: CheckSquare,
      trend: "neutral",
    },
    {
      title: "Hours This Week",
      value: `${stats.hoursThisWeek}h`,
      description: "Team total",
      icon: Clock,
      trend: "up",
    },
    {
      title: "Total Clients",
      value: stats.totalClients.toString(),
      description: "Active clients",
      icon: Users,
      trend: "up",
    },
    {
      title: "Overdue Invoices",
      value: stats.overdueInvoices.toString(),
      description: "Need attention",
      icon: AlertTriangle,
      trend: stats.overdueInvoices > 0 ? "down" : "neutral",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
