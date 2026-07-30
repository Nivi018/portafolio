"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { computeCartTotals, type CartTotals } from "@/lib/pricing"
import { getOrCreateGuestCartId } from "./guest-cart"

async function getOrCreateCart(userId?: string, guestId?: string) {
  const where = userId
    ? { userId }
    : guestId
    ? { guestId }
    : undefined
  if (!where) throw new Error("Cart owner required")

  let cart = await prisma.cart.findUnique({
    where: userId ? { userId } : { guestId: guestId! },
    include: {
      items: { include: { product: true, variant: true } },
      coupon: true,
    },
  })
  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { guestId: guestId! },
      include: {
        items: { include: { product: true, variant: true } },
        coupon: true,
      },
    })
  }
  return cart
}

async function getCartOwner() {
  const session = await auth()
  if (session?.user?.id) return { userId: session.user.id }
  const guestId = await getOrCreateGuestCartId()
  return { guestId }
}

export async function addToCartAction(input: {
  productId: string
  variantId?: string | null
  quantity: number
}) {
  const owner = await getCartOwner()
  if (!owner.userId && !owner.guestId) {
    return { ok: false, error: "Could not create cart" }
  }

  const { productId, variantId = null, quantity } = input
  if (quantity < 1) return { ok: false, error: "Invalid quantity" }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  })
  if (!product || !product.active) return { ok: false, error: "Product not available" }

  if (product.type === "PHYSICAL") {
    const available = variantId
      ? product.variants.find((v) => v.id === variantId)?.stock ?? 0
      : product.stock
    if (available < quantity) {
      return { ok: false, error: variantId ? "Variant out of stock" : "Out of stock" }
    }
  }

  const cart = await getOrCreateCart(owner.userId, owner.guestId)

  const existing = cart.items.find(
    (item) => item.productId === productId && item.variantId === variantId,
  )

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId,
        quantity,
      },
    })
  }

  revalidatePath("/cart")
  return { ok: true }
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  const owner = await getCartOwner()
  if (!owner.userId && !owner.guestId) {
    return { ok: false, error: "Unauthorized" }
  }

  if (quantity < 1) {
    return removeCartItemAction(itemId)
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true, variant: true },
  })
  if (!item) return { ok: false, error: "Item not found" }
  if (
    (owner.userId && item.cart.userId !== owner.userId) ||
    (owner.guestId && item.cart.guestId !== owner.guestId)
  ) {
    return { ok: false, error: "Item not found" }
  }

  if (item.product.type === "PHYSICAL") {
    const available = item.variant?.stock ?? item.product.stock
    if (available < quantity) {
      return { ok: false, error: `Only ${available} available` }
    }
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  })

  revalidatePath("/cart")
  return { ok: true }
}

export async function removeCartItemAction(itemId: string) {
  const owner = await getCartOwner()
  if (!owner.userId && !owner.guestId) {
    return { ok: false, error: "Unauthorized" }
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  })
  if (!item) return { ok: false, error: "Item not found" }
  if (
    (owner.userId && item.cart.userId !== owner.userId) ||
    (owner.guestId && item.cart.guestId !== owner.guestId)
  ) {
    return { ok: false, error: "Item not found" }
  }

  await prisma.cartItem.delete({ where: { id: itemId } })
  revalidatePath("/cart")
  return { ok: true }
}

export async function applyCouponAction(code: string) {
  const owner = await getCartOwner()
  if (!owner.userId && !owner.guestId) {
    return { ok: false, error: "Unauthorized" }
  }

  const normalized = code.trim().toUpperCase()
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } })

  if (!coupon || !coupon.active) {
    return { ok: false, error: "Invalid coupon code" }
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { ok: false, error: "Coupon has expired" }
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Coupon usage limit reached" }
  }

  const cart = await prisma.cart.findFirst({
    where: owner.userId
      ? { userId: owner.userId }
      : { guestId: owner.guestId },
    include: { items: { include: { product: true, variant: true } } },
  })
  if (!cart) return { ok: false, error: "Cart is empty" }

  const totals = computeCartTotals(
    cart.items.map((item) => ({
      price: Number(item.product.price) + Number(item.variant?.priceAdj ?? 0),
      quantity: item.quantity,
    })),
  )

  if (coupon.minPurchase && totals.subtotal < Number(coupon.minPurchase)) {
    return {
      ok: false,
      error: `Minimum purchase of $${Number(coupon.minPurchase).toFixed(2)} required`,
    }
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: coupon.id },
  })

  revalidatePath("/cart")
  return { ok: true }
}

export async function removeCouponAction() {
  const owner = await getCartOwner()
  if (!owner.userId && !owner.guestId) {
    return { ok: false, error: "Unauthorized" }
  }

  const cart = await prisma.cart.findFirst({
    where: owner.userId
      ? { userId: owner.userId }
      : { guestId: owner.guestId },
  })
  if (!cart) return { ok: false, error: "Cart not found" }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: null },
  })

  revalidatePath("/cart")
  return { ok: true }
}

export async function getCartTotals(): Promise<CartTotals & { itemCount: number }> {
  const owner = await getCartOwner()
  const cart = await prisma.cart.findFirst({
    where: owner.userId
      ? { userId: owner.userId }
      : { guestId: owner.guestId },
    include: {
      items: { include: { product: true, variant: true } },
      coupon: true,
    },
  })

  if (!cart) {
    return { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, itemCount: 0 }
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

  return { ...totals, itemCount: totals.itemCount }
}
