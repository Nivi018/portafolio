"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const respondSchema = z.object({
  reviewId: z.string().min(1),
  response: z.string().min(10).max(1000),
})

export async function adminRespondToReview(input: z.input<typeof respondSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const parsed = respondSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.review.update({
    where: { id: parsed.data.reviewId },
    data: {
      adminResponse: parsed.data.response,
      adminResponseAt: new Date(),
      adminResponseById: session.user.id,
    },
  })

  revalidatePath("/admin/reviews")
  revalidatePath(`/products`)
  return { ok: true }
}

export async function adminDeleteReviewResponse(reviewId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      adminResponse: null,
      adminResponseAt: null,
      adminResponseById: null,
    },
  })

  revalidatePath("/admin/reviews")
  return { ok: true }
}

export async function toggleReviewApproval(reviewId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { approved: true },
  })
  if (!review) return { ok: false, error: "Not found" }

  await prisma.review.update({
    where: { id: reviewId },
    data: { approved: !review.approved },
  })

  revalidatePath("/admin/reviews")
  return { ok: true }
}

export async function deleteReview(reviewId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  await prisma.review.delete({ where: { id: reviewId } })
  revalidatePath("/admin/reviews")
  return { ok: true }
}
