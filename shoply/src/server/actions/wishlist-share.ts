"use server"

import { cookies } from "next/headers"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { randomBytes } from "crypto"

const SHARE_COOKIE = "shoply_wishlist_share"

/**
 * Create a shareable wishlist link. The link includes the wishlist items
 * that the recipient can import to their own wishlist.
 */
export async function createWishlistShareLink() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Please sign in" }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, slug: true, name: true } },
        },
      },
    },
  })

  if (!wishlist || wishlist.items.length === 0) {
    return { ok: false, error: "Your wishlist is empty" }
  }

  const shareId = randomBytes(8).toString("hex")
  const cookieStore = await cookies()
  const shareData = {
    id: shareId,
    items: wishlist.items.map((i) => i.product),
    senderName: session.user.name ?? "Someone",
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  }
  cookieStore.set(SHARE_COOKIE, encodeURIComponent(JSON.stringify(shareData)), {
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    sameSite: "lax",
  })

  return { ok: true, shareId, url: `/wishlist?share=${shareId}` }
}

const importSchema = z.object({
  shareId: z.string().min(8).max(40),
  productIds: z.array(z.string().min(1)).min(1),
})

/**
 * Import items from a shared wishlist into the current user's wishlist.
 */
export async function importSharedWishlist(input: z.input<typeof importSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Please sign in" }

  const parsed = importSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  // Validate the share link
  const cookieStore = await cookies()
  const value = cookieStore.get(SHARE_COOKIE)?.value
  if (!value) return { ok: false, error: "Share link not found" }

  let shareData
  try {
    shareData = JSON.parse(decodeURIComponent(value))
  } catch {
    return { ok: false, error: "Invalid share link" }
  }

  if (shareData.id !== parsed.data.shareId || shareData.expiresAt < Date.now()) {
    return { ok: false, error: "Share link has expired" }
  }

  // Get or create user's wishlist
  const wishlist = await prisma.wishlist.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  })

  // Add only items that aren't already in the wishlist
  const existing = await prisma.wishlistItem.findMany({
    where: { wishlistId: wishlist.id },
    select: { productId: true },
  })
  const existingSet = new Set(existing.map((i) => i.productId))

  const toAdd = parsed.data.productIds.filter((id) => !existingSet.has(id))
  if (toAdd.length === 0) {
    return { ok: true, added: 0, message: "All items already in your wishlist" }
  }

  await prisma.wishlistItem.createMany({
    data: toAdd.map((productId) => ({ wishlistId: wishlist.id, productId })),
  })

  revalidatePath("/wishlist")
  return { ok: true, added: toAdd.length }
}
