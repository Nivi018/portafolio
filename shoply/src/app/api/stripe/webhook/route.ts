import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { sendOrderConfirmation } from "@/lib/email"

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const body = await request.text()
  const signature = (await headers()).get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object
    const orderId = paymentIntent.metadata?.orderId
    if (!orderId) {
      return NextResponse.json({ received: true })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true, variant: true } } },
    })

    if (!order) {
      return NextResponse.json({ received: true })
    }

    if (order.status === "PENDING") {
      // Decrement stock and mark as paid
      const customer = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { email: true, name: true },
      })
      const address = await prisma.address.findUnique({
        where: { id: order.addressId ?? "" },
        select: {
          fullName: true,
          street: true,
          city: true,
          state: true,
          zip: true,
          country: true,
        },
      })

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
        })

        for (const item of order.items) {
          if (item.product.type === "PHYSICAL") {
            if (item.variantId && item.variant) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } },
              })
            } else {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              })
            }
          }
        }

        // Increment coupon usage
        if (order.couponId) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { increment: 1 } },
          })
        }

        // Clear cart
        const cart = await tx.cart.findUnique({ where: { userId: order.userId } })
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
          await tx.cart.update({
            where: { id: cart.id },
            data: { couponId: null },
          })
        }

        // Create admin notification
        await tx.adminNotification.create({
          data: {
            type: "NEW_ORDER",
            title: `New order ${order.orderNumber}`,
            message: `${order.items.length} items, $${Number(order.total).toFixed(2)}`,
            metadata: { orderId: order.id },
          },
        })
      })

      // Send order confirmation email (after transaction commits)
      if (customer?.email) {
        // Award loyalty points
        try {
          const { awardPointsForOrder } = await import("@/server/actions/loyalty")
          await awardPointsForOrder(order.userId, Number(order.total), order.id)
        } catch (err) {
          console.error("Failed to award loyalty points:", err)
        }
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        sendOrderConfirmation({
          to: customer.email,
          customerName: customer.name,
          orderNumber: order.orderNumber,
          orderId: order.id,
          items: order.items.map((item) => ({
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            price: Number(item.price),
          })),
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          shipping: Number(order.shipping),
          total: Number(order.total),
          shippingAddress: address,
          appUrl,
        }).catch((err) => {
          console.error("Failed to send order confirmation:", err)
        })
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object
    const orderId = paymentIntent.metadata?.orderId
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } })
      if (order && order.status === "PENDING") {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}

export const dynamic = "force-dynamic"
