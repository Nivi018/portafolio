import Link from "next/link"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export const metadata = { title: "Categories" }

type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: { _count: { select: { products: true } } }
}>

export default async function CategoriesPage() {
  let categories: CategoryWithCount[] = []
  try {
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    })
  } catch {
    // DB not available
  }

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">No categories yet</h1>
        <p className="mt-3 text-muted-foreground">Run the seed script to populate the store.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">All categories</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="rounded-2xl border bg-card p-6 hover:bg-muted transition-colors"
          >
            <h3 className="font-semibold">{cat.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {cat._count.products} {cat._count.products === 1 ? "product" : "products"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
