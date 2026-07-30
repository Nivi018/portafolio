import { Search } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatOrderStatus, formatPrice } from "@/lib/format"
import { AdminOrdersFilters } from "@/components/admin/admin-orders-filters"
import { ExportOrdersButton } from "@/components/admin/export-orders-button"
import Link from "next/link"

export const metadata = { title: "Orders" }

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  PAID: "default",
  PROCESSING: "secondary",
  SHIPPED: "secondary",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
}

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>

const PAGE_SIZE = 20

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { status, q, page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10) || 1)

  const where = {
    ...(status ? { status: status as "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" as const } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (pageNum - 1) * PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">{total} total orders</p>
        </div>
        <ExportOrdersButton currentStatus={status} />
      </div>

      <AdminOrdersFilters currentStatus={status} currentQuery={q} />

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No orders found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">
                      <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{o.user.name ?? "—"}</p>
                        <p className="text-muted-foreground text-xs">{o.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[o.status] ?? "outline"}>
                        {formatOrderStatus(o.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{o.items.length}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatPrice(o.total)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" render={<Link href={`/admin/orders/${o.id}`} />}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {pageNum > 1 && (
            <Button variant="outline" size="sm" render={<Link href={`/admin/orders?page=${pageNum - 1}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}`} />}>
              Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {pageNum} of {totalPages}
          </span>
          {pageNum < totalPages && (
            <Button variant="outline" size="sm" render={<Link href={`/admin/orders?page=${pageNum + 1}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}`} />}>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
