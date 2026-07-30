"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["activate", "deactivate", "delete", "feature", "unfeature"]),
})

export async function bulkProductAction(input: z.input<typeof bulkSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const parsed = bulkSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { ids, action } = parsed.data

  try {
    switch (action) {
      case "activate":
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { active: true },
        })
        break
      case "deactivate":
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { active: false },
        })
        break
      case "feature":
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { featured: true },
        })
        break
      case "unfeature":
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { featured: false },
        })
        break
      case "delete":
        // Check if any have orders
        const withOrders = await prisma.orderItem.findFirst({
          where: { productId: { in: ids } },
        })
        if (withOrders) {
          return {
            ok: false,
            error: "Cannot delete products that have orders. Deactivate instead.",
          }
        }
        await prisma.product.deleteMany({ where: { id: { in: ids } } })
        break
    }

    revalidatePath("/admin/products")
    revalidatePath("/products")
    return { ok: true, count: ids.length }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bulk action failed",
    }
  }
}
