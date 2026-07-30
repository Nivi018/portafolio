import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

type Params = Promise<{ slug: string }>

type CategoryWithProducts = Prisma.CategoryGetPayload<{
  include: {
    products: {
      include: { images: true }
    }
  }
}>

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params

  let category: CategoryWithProducts | null = null
  try {
    category = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { active: true },
          include: { images: { take: 1, orderBy: { position: "asc" } } },
        },
      },
    })
  } catch {
    notFound()
  }

  if (!category) notFound()

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{category.name}</h1>
      {category.description && (
        <p className="mt-2 text-muted-foreground">{category.description}</p>
      )}

      {category.products.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">No products in this category yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {category.products.map((product) => (
            <a
              key={product.id}
              href={`/products/${product.slug}`}
              className="group rounded-2xl border bg-card overflow-hidden transition-colors hover:bg-muted"
            >
              <div className="aspect-square bg-muted overflow-hidden">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt ?? product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                <p className="mt-1 font-semibold">${Number(product.price).toFixed(2)}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
