import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Package } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatOrderStatus } from "@/lib/format"

export const metadata: Metadata = { title: "Orders" }

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  PAID: "default",
  PROCESSING: "secondary",
  SHIPPED: "secondary",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?next=/account/orders")

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: true, variant: true } },
      address: true,
    },
    orderBy: { createdAt: "desc" },
  })

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
          <Package className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">No orders yet</h1>
        <p className="mt-3 text-muted-foreground">Start shopping to see your orders here.</p>
        <Button size="lg" className="mt-8" render={<Link href="/products" />}>
          Browse products
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {orders.length} {orders.length === 1 ? "order" : "orders"}
      </p>

      <div className="mt-8 space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="block rounded-2xl border bg-card p-5 hover:bg-muted transition-colors"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="font-mono text-sm font-medium">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-lg font-semibold tabular-nums">
                  ${Number(order.total).toFixed(2)}
                </p>
                <Badge variant={statusVariants[order.status] ?? "outline"}>
                  {formatOrderStatus(order.status)}
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
