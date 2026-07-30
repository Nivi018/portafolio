import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

type ProductWithImage = Prisma.ProductGetPayload<{
  include: { images: { take: 1 }; category: { select: { name: true; slug: true } } }
}>

/**
 * Get featured products for the home page. Cached for 5 minutes.
 */
export const getFeaturedProducts = unstable_cache(
  async (): Promise<ProductWithImage[]> => {
    return prisma.product.findMany({
      where: { active: true, featured: true },
      include: {
        images: { take: 1, orderBy: { position: "asc" } },
        category: { select: { name: true, slug: true } },
      },
      take: 8,
    })
  },
  ["featured-products"],
  { revalidate: 300, tags: ["products"] },
)

/**
 * Get all categories. Cached for 1 hour.
 */
export const getAllCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { active: true } } } } },
    })
  },
  ["all-categories"],
  { revalidate: 3600, tags: ["categories"] },
)

/**
 * Get a product by slug. Cached for 5 minutes.
 */
export const getCachedProduct = unstable_cache(
  async (slug: string) => {
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
  },
  ["product-by-slug"],
  { revalidate: 300, tags: ["products"] },
)
