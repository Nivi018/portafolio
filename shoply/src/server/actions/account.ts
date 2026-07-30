"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const profileSchema = z.object({
  name: z.string().min(2).max(60),
})

export async function updateProfileAction(input: z.input<typeof profileSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" }

  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  })

  revalidatePath("/account")
  return { ok: true }
}

const addressSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2).max(60),
  street: z.string().min(3).max(120),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  zip: z.string().min(3).max(15),
  country: z.string().min(2).max(60).default("US"),
  isDefault: z.boolean().default(false),
})

export async function saveAddressAction(input: z.input<typeof addressSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" }

  const parsed = addressSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const data = parsed.data

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    })
  }

  if (data.id) {
    // Update
    const existing = await prisma.address.findUnique({ where: { id: data.id } })
    if (!existing || existing.userId !== session.user.id) {
      return { ok: false, error: "Address not found" }
    }
    await prisma.address.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        isDefault: data.isDefault,
      },
    })
  } else {
    // Create
    await prisma.address.create({
      data: {
        userId: session.user.id,
        fullName: data.fullName,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        isDefault: data.isDefault,
      },
    })
  }

  revalidatePath("/account/addresses")
  return { ok: true }
}

export async function deleteAddressAction(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" }

  const existing = await prisma.address.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return { ok: false, error: "Address not found" }
  }

  await prisma.address.delete({ where: { id } })
  revalidatePath("/account/addresses")
  return { ok: true }
}

export async function setDefaultAddressAction(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" }

  const existing = await prisma.address.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return { ok: false, error: "Address not found" }
  }

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id },
      data: { isDefault: true },
    }),
  ])

  revalidatePath("/account/addresses")
  return { ok: true }
}
