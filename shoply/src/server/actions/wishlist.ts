"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function getOrCreateWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: { items: true },
  })
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
      include: { items: true },
    })
  }
  return wishlist
}

export async function toggleWishlistAction(productId: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Please sign in" }

  const wishlist = await getOrCreateWishlist(session.user.id)
  const existing = wishlist.items.find((i) => i.productId === productId)

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } })
  } else {
    await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId },
    })
  }

  revalidatePath("/wishlist")
  revalidatePath(`/products`)
  return { ok: true, added: !existing }
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false

  const item = await prisma.wishlistItem.findFirst({
    where: { productId, wishlist: { userId: session.user.id } },
    select: { id: true },
  })
  return !!item
}
