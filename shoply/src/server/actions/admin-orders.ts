"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendOrderStatusUpdate } from "@/lib/email"
import { OrderStatus } from "@/generated/prisma/enums"

const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "PENDING",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
})

export async function updateOrderStatusAction(input: z.input<typeof updateStatusSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const parsed = updateStatusSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const order = await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: { status: parsed.data.status },
    include: {
      user: { select: { email: true, name: true } },
    },
  })

  // Send email for major status changes (only if status actually changed)
  if (order.user?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    sendOrderStatusUpdate({
      to: order.user.email,
      customerName: order.user.name,
      orderNumber: order.orderNumber,
      orderId: order.id,
      newStatus: parsed.data.status,
      appUrl,
    }).catch((err) => {
      console.error("Failed to send order status email:", err)
    })
  }

  revalidatePath(`/admin/orders/${parsed.data.orderId}`)
  revalidatePath(`/admin/orders`)
  revalidatePath(`/admin`)
  revalidatePath(`/account/orders`)
  revalidatePath(`/account/orders/${parsed.data.orderId}`)

  return { ok: true }
}
