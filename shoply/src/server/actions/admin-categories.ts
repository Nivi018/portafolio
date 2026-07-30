"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
})

export async function saveCategoryAction(input: z.input<typeof categorySchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { id, ...data } = parsed.data

  const slugExists = await prisma.category.findFirst({
    where: { slug: data.slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  })
  if (slugExists) return { ok: false, error: "Slug already in use" }

  if (id) {
    await prisma.category.update({ where: { id }, data })
  } else {
    await prisma.category.create({ data })
  }

  revalidatePath("/admin/categories")
  revalidatePath("/categories")
  return { ok: true }
}

export async function deleteCategoryAction(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    return { ok: false, error: `Cannot delete: ${productCount} product(s) use this category` }
  }

  await prisma.category.delete({ where: { id } })
  revalidatePath("/admin/categories")
  revalidatePath("/categories")
  return { ok: true }
}
