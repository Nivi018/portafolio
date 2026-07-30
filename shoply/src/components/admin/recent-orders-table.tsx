"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatOrderStatus, formatPrice } from "@/lib/format"

type Order = {
  id: string
  orderNumber: string
  customer: string
  total: number
  status: string
  itemCount: number
  createdAt: string
}

const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  PAID: "default",
  PROCESSING: "secondary",
  SHIPPED: "secondary",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
}

export function RecentOrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Date</TableHead>
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
            <TableCell className="text-sm">{o.customer}</TableCell>
            <TableCell>
              <Badge variant={variants[o.status] ?? "outline"}>
                {formatOrderStatus(o.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{o.itemCount}</TableCell>
            <TableCell className="text-right tabular-nums font-semibold">
              {formatPrice(o.total)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(o.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
