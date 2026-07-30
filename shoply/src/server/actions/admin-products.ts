"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma, ProductType } from "@/generated/prisma/client"

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  description: z.string().min(10),
  shortDesc: z.string().max(200).optional().nullable(),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().positive().optional().nullable(),
  type: z.enum(["PHYSICAL", "DIGITAL"]),
  categoryId: z.string().min(1),
  stock: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  weight: z.coerce.number().optional().nullable(),
  requiresShipping: z.boolean().default(true),
  downloadUrl: z.string().optional().nullable(),
  downloadLimit: z.coerce.number().int().min(0).optional().nullable(),
})

export async function saveProductAction(input: z.input<typeof productSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { id, ...data } = parsed.data

  // Check slug uniqueness
  const slugExists = await prisma.product.findFirst({
    where: { slug: data.slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  })
  if (slugExists) {
    return { ok: false, error: "Slug already in use" }
  }

  if (id) {
    await prisma.product.update({
      where: { id },
      data: {
        ...data,
        comparePrice: data.comparePrice ?? null,
        shortDesc: data.shortDesc ?? null,
        weight: data.weight ?? null,
        downloadUrl: data.downloadUrl ?? null,
        downloadLimit: data.downloadLimit ?? null,
      },
    })
  } else {
    await prisma.product.create({
      data: {
        ...data,
        comparePrice: data.comparePrice ?? null,
        shortDesc: data.shortDesc ?? null,
        weight: data.weight ?? null,
        downloadUrl: data.downloadUrl ?? null,
        downloadLimit: data.downloadLimit ?? null,
        stock: data.type === "DIGITAL" ? 9999 : data.stock,
      },
    })
  }

  revalidatePath("/admin/products")
  revalidatePath("/products")
  revalidatePath("/")

  return { ok: true }
}

export async function deleteProductAction(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  await prisma.product.delete({ where: { id } })
  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { ok: true }
}

export async function toggleProductActiveAction(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { active: true },
  })
  if (!product) return { ok: false, error: "Not found" }

  await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  })

  revalidatePath("/admin/products")
  return { ok: true }
}
