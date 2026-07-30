"use server"

import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const GUEST_CART_COOKIE = "shoply_guest_cart"
const GUEST_CART_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Get or create a guest cart ID stored in a cookie. Used to identify
 * unauthenticated shoppers so we can persist their cart in the DB.
 */
export async function getOrCreateGuestCartId(): Promise<string> {
  const cookieStore = await cookies()
  let id = cookieStore.get(GUEST_CART_COOKIE)?.value
  if (id) return id

  id = randomBytes(16).toString("hex")
  cookieStore.set(GUEST_CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GUEST_CART_MAX_AGE,
    path: "/",
  })
  return id
}

/**
 * Get the current effective cart owner. Returns userId if authenticated,
 * otherwise the guest cart ID.
 */
export async function getCartOwner(): Promise<{ userId: string } | { guestId: string }> {
  const session = await auth()
  if (session?.user?.id) return { userId: session.user.id }
  const guestId = await getOrCreateGuestCartId()
  return { guestId }
}

/**
 * Merge a guest cart into a user's cart on login. Items from the guest cart
 * are added to the user's cart, with quantities summed when the same product
 * + variant is already in the user's cart.
 */
export async function mergeGuestCartToUser(userId: string, guestId: string) {
  const guestCart = await prisma.cart.findUnique({
    where: { guestId },
    include: { items: true },
  })
  if (!guestCart || guestCart.items.length === 0) return

  const userCart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: { items: true },
  })

  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (i) =>
        i.productId === guestItem.productId &&
        (i.variantId ?? null) === (guestItem.variantId ?? null),
    )
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + guestItem.quantity },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
        },
      })
    }
  }

  // Delete the guest cart
  await prisma.cart.delete({ where: { id: guestCart.id } })
}
