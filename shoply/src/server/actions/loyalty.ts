"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { LoyaltyTier } from "@/generated/prisma/enums"

const POINTS_PER_DOLLAR = 10 // 1 point per $0.10
const POINTS_TO_DOLLAR = 100 // 100 points = $1

/**
 * Get or create a loyalty account for the current user.
 */
export async function getOrCreateLoyaltyAccount() {
  const session = await auth()
  if (!session?.user?.id) return null

  let account = await prisma.loyaltyAccount.findUnique({
    where: { userId: session.user.id },
  })

  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: { userId: session.user.id },
    })
  }

  return account
}

/**
 * Award points for a completed order. Should be called from the Stripe
 * webhook when an order is paid.
 */
export async function awardPointsForOrder(userId: string, orderTotal: number, orderId: string) {
  const account = await getOrCreateLoyaltyAccount()
  if (!account) return

  const points = Math.floor(orderTotal * POINTS_PER_DOLLAR)
  if (points <= 0) return

  const newPoints = account.points + points
  const newLifetime = account.lifetime + points

  // Tier based on lifetime points
  const tier: LoyaltyTier =
    newLifetime >= 5000 ? "PLATINUM" :
    newLifetime >= 2000 ? "GOLD" :
    newLifetime >= 500 ? "SILVER" : "BRONZE"

  await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newPoints, lifetime: newLifetime, tier },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        points,
        type: "EARN_ORDER",
        reason: `Earned from order #${orderId.slice(-6).toUpperCase()}`,
        orderId,
      },
    }),
  ])
}

/**
 * Redeem points for a discount. Returns the discount amount or null if
 * insufficient points.
 */
export async function redeemPoints(userId: string, pointsToRedeem: number) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId },
  })
  if (!account || account.points < pointsToRedeem) return null

  // Minimum redemption: 100 points
  if (pointsToRedeem < 100) return null

  const discount = pointsToRedeem / POINTS_TO_DOLLAR

  await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { userId },
      data: { points: { decrement: pointsToRedeem } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        points: -pointsToRedeem,
        type: "REDEEM_DISCOUNT",
        reason: `Redeemed for $${discount.toFixed(2)} discount`,
      },
    }),
  ])

  return { discount, remainingPoints: account.points - pointsToRedeem }
}
