"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  productId: z.string().min(1),
  email: z.string().email(),
})

export async function subscribeToStockNotification(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { productId, email } = parsed.data

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return { ok: false, error: "Product not found" }
  if (product.type !== "PHYSICAL") {
    return { ok: false, error: "Only available for physical products" }
  }
  if (product.stock > 0) {
    return { ok: false, error: "Product is already in stock" }
  }

  await prisma.stockNotification.upsert({
    where: { productId_email: { productId, email } },
    create: { productId, email },
    update: { notified: false, createdAt: new Date() },
  })

  revalidatePath(`/products/${product.slug}`)
  return { ok: true }
}

const newsletterSchema = z.object({
  email: z.string().email(),
})

export async function subscribeToNewsletter(input: z.input<typeof newsletterSchema>) {
  const parsed = newsletterSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email" }
  }

  const { email } = parsed.data

  await prisma.newsletterSubscription.upsert({
    where: { email },
    create: { email },
    update: { active: true, unsubscribedAt: null },
  })

  return { ok: true }
}
