"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const askSchema = z.object({
  productId: z.string().min(1),
  question: z.string().min(10).max(500),
})

const answerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(5).max(1000),
})

export async function askProductQuestion(input: z.input<typeof askSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Please sign in to ask a question" }

  const parsed = askSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.productQuestion.create({
    data: {
      productId: parsed.data.productId,
      userId: session.user.id,
      question: parsed.data.question,
    },
  })

  revalidatePath(`/products`)
  return { ok: true }
}

export async function answerProductQuestion(input: z.input<typeof answerSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const parsed = answerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.productQuestion.update({
    where: { id: parsed.data.questionId },
    data: {
      answer: parsed.data.answer,
      answeredAt: new Date(),
      answeredById: session.user.id,
    },
  })

  revalidatePath(`/products`)
  revalidatePath(`/admin/questions`)
  return { ok: true }
}

export async function deleteProductQuestion(questionId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" }
  }

  const question = await prisma.productQuestion.findUnique({
    where: { id: questionId },
  })
  if (!question) return { ok: false, error: "Not found" }

  // Owner or admin can delete
  if (question.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { ok: false, error: "Forbidden" }
  }

  await prisma.productQuestion.delete({ where: { id: questionId } })
  revalidatePath(`/products`)
  return { ok: true }
}
