import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export type ProductDetail = Prisma.ProductGetPayload<{
  include: {
    images: true
    variants: true
    category: true
    reviews: {
      include: { user: { select: { name: true; image: true } } }
    }
  }
}>

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { value: "asc" } },
      category: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, image: true } } },
        take: 20,
      },
    },
  })
}

export async function getRelatedProducts(productId: string, categoryId: string, take = 4) {
  return prisma.product.findMany({
    where: {
      active: true,
      categoryId,
      id: { not: productId },
    },
    include: {
      images: { take: 1, orderBy: { position: "asc" } },
    },
    take,
    orderBy: { createdAt: "desc" },
  })
}
