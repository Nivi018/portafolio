"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters").max(1000),
})

export async function createReviewAction(input: z.input<typeof reviewSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Please sign in to leave a review" }

  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { productId, rating, comment } = parsed.data

  // Verify user has purchased the product
  const hasPurchased = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
      items: { some: { productId } },
    },
    select: { id: true },
  })

  if (!hasPurchased) {
    return { ok: false, error: "You can only review products you've purchased" }
  }

  await prisma.review.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: {
      userId: session.user.id,
      productId,
      rating,
      comment,
      verified: true,
    },
    update: { rating, comment },
  })

  revalidatePath(`/products`)
  return { ok: true }
}
