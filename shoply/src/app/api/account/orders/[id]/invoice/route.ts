import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { InvoiceDocument } from "@/components/invoice/invoice-document"

type Params = Promise<{ id: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      address: true,
      items: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const buffer = await renderToBuffer(
    InvoiceDocument({
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      status: order.status,
      customerName: order.user.name,
      customerEmail: order.user.email,
      items: order.items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      total: Number(order.total),
      shippingAddress: order.address
        ? {
            fullName: order.address.fullName,
            street: order.address.street,
            city: order.address.city,
            state: order.address.state,
            zip: order.address.zip,
            country: order.address.country,
          }
        : null,
    }),
  )

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.pdf"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  })
}
