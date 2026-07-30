import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ProductFilters } from "@/components/store/product-filters"
import { ProductSort } from "@/components/store/product-sort"
import { Pagination } from "@/components/store/pagination"
import type { Prisma } from "@/generated/prisma/client"
import { SlidersHorizontal, X } from "lucide-react"

export const metadata = { title: "All products" }

const PAGE_SIZE = 12

type SearchParams = Promise<{
  category?: string
  type?: "PHYSICAL" | "DIGITAL"
  minPrice?: string
  maxPrice?: string
  minRating?: string
  sort?: "newest" | "price-asc" | "price-desc" | "name-asc" | "rating"
  page?: string
  q?: string
}>

type ProductWithImage = Prisma.ProductGetPayload<{
  include: { images: { take: 1 } }
}>

function buildWhere(params: Awaited<SearchParams>): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { active: true }
  if (params.category) where.category = { slug: params.category }
  if (params.type) where.type = params.type
  if (params.minPrice || params.maxPrice) {
    where.price = {}
    if (params.minPrice) (where.price as Record<string, number>).gte = Number(params.minPrice)
    if (params.maxPrice) (where.price as Record<string, number>).lte = Number(params.maxPrice)
  }
  if (params.minRating) {
    // Need to filter by aggregate, which Prisma can't do directly in where
    // We'll filter in-memory below for accuracy
  }
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { sku: { contains: params.q, mode: "insensitive" } },
    ]
  }
  return where
}

function buildOrderBy(sort: Awaited<SearchParams>["sort"]) {
  switch (sort) {
    case "price-asc":
      return { price: "asc" as const }
    case "price-desc":
      return { price: "desc" as const }
    case "name-asc":
      return { name: "asc" as const }
    case "rating":
      return { createdAt: "desc" as const } // we'll sort by rating post-fetch
    case "newest":
    default:
      return { createdAt: "desc" as const }
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const pageNum = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const sort = params.sort

  const where = buildWhere(params)
  const orderBy = buildOrderBy(sort)

  const [allProducts, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { take: 1, orderBy: { position: "asc" } },
        reviews: { select: { rating: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy,
      take: sort === "rating" ? 100 : PAGE_SIZE,
      skip: sort === "rating" ? 0 : (pageNum - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ])

  // Filter by minRating in memory (Prisma doesn't support aggregate in where)
  let products = allProducts
  if (params.minRating) {
    const min = Number(params.minRating)
    products = products.filter((p) => {
      if (p.reviews.length === 0) return false
      const avg = p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
      return avg >= min
    })
  }

  // Sort by rating
  if (sort === "rating") {
    products = [...products]
      .map((p) => ({
        ...p,
        avgRating:
          p.reviews.length > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const activeFilterCount =
    (params.category ? 1 : 0) +
    (params.type ? 1 : 0) +
    (params.minPrice ? 1 : 0) +
    (params.maxPrice ? 1 : 0) +
    (params.minRating ? 1 : 0) +
    (params.q ? 1 : 0)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {params.q ? `Results for "${params.q}"` : "All products"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
          </p>
        </div>
        <ProductSort currentSort={params.sort ?? "newest"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-8">
        <aside>
          <ProductFilters
            categories={categories}
            currentCategory={params.category}
            currentType={params.type}
            currentMinPrice={params.minPrice}
            currentMaxPrice={params.maxPrice}
            currentMinRating={params.minRating}
            activeCount={activeFilterCount}
          />
        </aside>

        <div>
          {products.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <SlidersHorizontal className="h-10 w-10 mx-auto mb-4 opacity-30" />
                <h3 className="font-semibold">No products match your filters</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try removing some filters or browsing all products.
                </p>
                <Button variant="outline" className="mt-4" render={<Link href="/products" />}>
                  Clear all filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const avgRating =
                    product.reviews.length > 0
                      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
                      : 0
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group rounded-2xl border bg-card overflow-hidden transition-colors hover:bg-muted"
                    >
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].alt ?? product.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                            No image
                          </div>
                        )}
                        {product.type === "DIGITAL" && (
                          <Badge variant="secondary" className="absolute top-3 left-3">
                            Digital
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <p className="text-xs text-muted-foreground">{product.category.name}</p>
                        <h3 className="font-medium line-clamp-1">{product.name}</h3>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">${Number(product.price).toFixed(2)}</p>
                          {avgRating > 0 && (
                            <p className="text-xs text-muted-foreground">★ {avgRating.toFixed(1)}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={pageNum}
                  totalPages={totalPages}
                  basePath="/products"
                  searchParams={params as Record<string, string | undefined>}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
