"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { randomBytes } from "crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { GiftCardEmail } from "@/emails/gift-card"

const createGiftCardSchema = z.object({
  amount: z.coerce.number().positive().max(1000),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  expiresInDays: z.coerce.number().int().min(30).max(365).default(365),
})

function generateGiftCode() {
  return `GIFT-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`
}

export async function createGiftCardAction(input: z.input<typeof createGiftCardSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Please sign in" }

  const parsed = createGiftCardSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { amount, recipientEmail, recipientName, message, expiresInDays } = parsed.data
  const code = generateGiftCode()
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  const giftCard = await prisma.giftCard.create({
    data: {
      code,
      initialAmount: amount,
      balance: amount,
      purchasedById: session.user.id,
      recipientEmail: recipientEmail ?? null,
      recipientName: recipientName ?? null,
      message: message ?? null,
      expiresAt,
    },
  })

  // Send email to recipient
  if (recipientEmail) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      await sendEmail({
        to: recipientEmail,
        subject: `You've received a $${amount} Shoply gift card!`,
        react: GiftCardEmail({
          code,
          amount,
          recipientName: recipientName ?? "Friend",
          senderName: session.user.name ?? "Someone",
          message: message ?? null,
          redeemUrl: `${appUrl}/redeem?code=${code}`,
          expiresAt: expiresAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        }),
      })
    } catch (err) {
      console.error("Failed to send gift card email:", err)
    }
  }

  revalidatePath("/account/gift-cards")
  return { ok: true, code, id: giftCard.id }
}

const redeemSchema = z.object({
  code: z.string().min(8).max(40),
})

export async function redeemGiftCardAction(input: z.input<typeof redeemSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Please sign in" }

  const parsed = redeemSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid code" }

  const card = await prisma.giftCard.findUnique({ where: { code: parsed.data.code } })
  if (!card) return { ok: false, error: "Gift card not found" }
  if (!card.active) return { ok: false, error: "Gift card is no longer active" }
  if (card.expiresAt < new Date()) return { ok: false, error: "Gift card has expired" }
  if (Number(card.balance) <= 0) return { ok: false, error: "Gift card has no balance" }

  return {
    ok: true,
    balance: Number(card.balance),
    code: card.code,
  }
}

export async function getUserGiftCards() {
  const session = await auth()
  if (!session?.user?.id) return []
  return prisma.giftCard.findMany({
    where: { purchasedById: session.user.id },
    orderBy: { createdAt: "desc" },
  })
}
