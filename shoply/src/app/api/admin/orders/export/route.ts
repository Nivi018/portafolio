import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { formatOrderStatus, formatPrice } from "@/lib/format"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate)
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      address: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Build CSV
  const headers = [
    "Order Number",
    "Date",
    "Status",
    "Customer Name",
    "Customer Email",
    "Items",
    "Subtotal",
    "Discount",
    "Shipping",
    "Tax",
    "Total",
    "Shipping Address",
    "Items Detail",
  ]

  const rows = orders.map((o) => {
    const itemDetail = o.items
      .map((i) => `${i.quantity}x ${i.productName}${i.variantName ? ` (${i.variantName})` : ""}`)
      .join("; ")
    const addr = o.address
      ? `${o.address.fullName}, ${o.address.street}, ${o.address.city}, ${o.address.state} ${o.address.zip}, ${o.address.country}`
      : ""
    return [
      o.orderNumber,
      o.createdAt.toISOString(),
      formatOrderStatus(o.status),
      o.user.name ?? "",
      o.user.email,
      o.items.length.toString(),
      Number(o.subtotal).toFixed(2),
      Number(o.discount).toFixed(2),
      Number(o.shipping).toFixed(2),
      Number(o.tax).toFixed(2),
      Number(o.total).toFixed(2),
      addr,
      itemDetail,
    ]
  })

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n")

  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

function escapeCsv(value: string): string {
  // Escape quotes and wrap in quotes if contains special chars
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes(";")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
