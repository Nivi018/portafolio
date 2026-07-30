import { DollarSign, Package, ShoppingBag, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChart } from "@/components/admin/revenue-chart"
import { RecentOrdersTable } from "@/components/admin/recent-orders-table"
import { LowStockList } from "@/components/admin/low-stock-list"

export const metadata = { title: "Dashboard" }

export default async function AdminDashboard() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [revenueAgg, orderCount, customerCount, productCount] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.product.count(),
  ])

  const paidOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { total: true, createdAt: true },
  })

  const recentOrders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const lowStock = await prisma.product.findMany({
    where: {
      active: true,
      type: "PHYSICAL",
      stock: { lte: 5 },
    },
    select: { id: true, name: true, stock: true },
    orderBy: { stock: "asc" },
    take: 5,
  })

  const totalRevenue = Number(revenueAgg._sum.total ?? 0)

  // Group revenue by day for chart
  const revenueByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    revenueByDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const order of paidOrders) {
    const day = order.createdAt.toISOString().slice(0, 10)
    if (day in revenueByDay) {
      revenueByDay[day] += Number(order.total)
    }
  }
  const chartData = Object.entries(revenueByDay).map(([date, total]) => ({
    date,
    total: Math.round(total * 100) / 100,
  }))

  const stats = [
    {
      label: "Total revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "All paid orders",
    },
    {
      label: "Orders",
      value: orderCount.toString(),
      icon: ShoppingBag,
      description: "Lifetime",
    },
    {
      label: "Customers",
      value: customerCount.toString(),
      icon: Users,
      description: "Registered clients",
    },
    {
      label: "Products",
      value: productCount.toString(),
      icon: Package,
      description: "In catalog",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                <span>{stat.label}</span>
                <stat.icon className="h-4 w-4" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <CardDescription>Products with ≤ 5 in stock</CardDescription>
          </CardHeader>
          <CardContent>
            <LowStockList items={lowStock} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrdersTable
            orders={recentOrders.map((o) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              customer: o.user.name ?? o.user.email,
              total: Number(o.total),
              status: o.status,
              itemCount: o.items.length,
              createdAt: o.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
