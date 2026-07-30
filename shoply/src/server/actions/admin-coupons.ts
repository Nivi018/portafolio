"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2).max(40).regex(/^[A-Z0-9_-]+$/i, "Letters, numbers, hyphens, underscores only").transform((s) => s.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive(),
  minPurchase: z.coerce.number().min(0).optional().nullable(),
  maxUses: z.coerce.number().int().min(0).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  active: z.boolean().default(true),
})

export async function saveCouponAction(input: z.input<typeof couponSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const parsed = couponSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { id, ...data } = parsed.data

  if (data.type === "PERCENT" && data.value > 100) {
    return { ok: false, error: "Percentage cannot exceed 100" }
  }

  const codeExists = await prisma.coupon.findFirst({
    where: { code: data.code, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  })
  if (codeExists) return { ok: false, error: "Coupon code already exists" }

  if (id) {
    await prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })
  } else {
    await prisma.coupon.create({
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })
  }

  revalidatePath("/admin/coupons")
  return { ok: true }
}

export async function deleteCouponAction(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  await prisma.coupon.delete({ where: { id } })
  revalidatePath("/admin/coupons")
  return { ok: true }
}
