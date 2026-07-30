"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { computeCartTotals, type CartTotals } from "@/lib/pricing"
import { stripe, getPublishableKey } from "@/lib/stripe"
import { awardPointsForOrder } from "./loyalty"

const checkoutSchema = z.object({
  addressId: z.string().min(1).optional(),
  newAddress: z
    .object({
      fullName: z.string().min(2),
      street: z.string().min(3),
      city: z.string().min(2),
      state: z.string().min(2),
      zip: z.string().min(3),
      country: z.string().min(2).default("US"),
    })
    .optional(),
  shippingMethod: z.enum(["standard", "express"]),
})

export type CheckoutData = z.input<typeof checkoutSchema>

function generateOrderNumber() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, "")
  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0")
  return `ORD-${date}-${random}`
}

async function buildOrderForUser(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: true, variant: true } },
      coupon: true,
    },
  })

  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty" as const }
  }

  // Check stock
  for (const item of cart.items) {
    if (item.product.type === "PHYSICAL") {
      const available = item.variant?.stock ?? item.product.stock
      if (available < item.quantity) {
        return {
          error: `Not enough stock for ${item.product.name}`,
        }
      }
    }
  }

  const totals = computeCartTotals(
    cart.items.map((item) => ({
      price: Number(item.product.price) + Number(item.variant?.priceAdj ?? 0),
      quantity: item.quantity,
    })),
    cart.coupon
      ? {
          type: cart.coupon.type,
          value: Number(cart.coupon.value),
        }
      : null,
  )

  return { cart, totals }
}

export async function createCheckoutAction(input: CheckoutData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Please sign in" }

  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { addressId, newAddress, shippingMethod } = parsed.data

  const result = await buildOrderForUser(session.user.id)
  if ("error" in result) return { ok: false, error: result.error }

  const { cart, totals } = result

  // Resolve address
  let address
  if (addressId) {
    address = await prisma.address.findUnique({ where: { id: addressId } })
    if (!address || address.userId !== session.user.id) {
      return { ok: false, error: "Invalid address" }
    }
  } else if (newAddress) {
    address = await prisma.address.create({
      data: {
        userId: session.user.id,
        fullName: newAddress.fullName,
        street: newAddress.street,
        city: newAddress.city,
        state: newAddress.state,
        zip: newAddress.zip,
        country: newAddress.country,
      },
    })
  } else {
    return { ok: false, error: "Address is required" }
  }

  // Compute shipping
  const shipping = totals.shipping
  const grandTotal = totals.subtotal - totals.discount + shipping
  const finalTotals: CartTotals = { ...totals, shipping, total: grandTotal }

  // Create the order in PENDING state
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session.user.id,
      addressId: address.id,
      status: "PENDING",
      subtotal: finalTotals.subtotal,
      discount: finalTotals.discount,
      shipping: finalTotals.shipping,
      tax: finalTotals.tax,
      total: finalTotals.total,
      couponId: cart.couponId,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          variantName: item.variant?.value ?? null,
          price: item.product.price,
          quantity: item.quantity,
        })),
      },
    },
  })

  // Create Stripe PaymentIntent
  let clientSecret: string
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalTotals.total * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: session.user.id,
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    clientSecret = paymentIntent.client_secret!
  } catch (err) {
    // Clean up the order since we can't process payment
    await prisma.order.delete({ where: { id: order.id } })
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Payment setup failed: ${err.message}`
          : "Payment setup failed",
    }
  }

  revalidatePath("/account/orders")
  return {
    ok: true,
    orderId: order.id,
    clientSecret,
    publishableKey: getPublishableKey(),
  }
}

export async function clearCartAction() {
  const session = await auth()
  if (!session?.user?.id) return
  const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } })
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }
}
