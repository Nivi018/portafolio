import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag } from "lucide-react"

type Props = {
  productId: string
  limit?: number
}

/**
 * Server component that shows products frequently bought together with the
 * given product, based on order history analysis.
 */
export async function FrequentlyBoughtTogether({ productId, limit = 4 }: Props) {
  // Find the order items that include the current product, then find other
  // products that appear in the same orders, ranked by frequency.
  const orderItems = await prisma.orderItem.findMany({
    where: { productId },
    select: { orderId: true },
    take: 200,
  })

  const orderIds = [...new Set(orderItems.map((i) => i.orderId))]

  if (orderIds.length === 0) return null

  const otherItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      orderId: { in: orderIds },
      productId: { not: productId },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit,
  })

  if (otherItems.length === 0) return null

  const recommended = await prisma.product.findMany({
    where: {
      id: { in: otherItems.map((i) => i.productId) },
      active: true,
    },
    include: { images: { take: 1, orderBy: { position: "asc" } } },
  })

  // Sort by frequency count
  recommended.sort(
    (a, b) =>
      (otherItems.find((i) => i.productId === b.id)?._count.productId ?? 0) -
      (otherItems.find((i) => i.productId === a.id)?._count.productId ?? 0),
  )

  if (recommended.length === 0) return null

  return (
    <section className="mt-16 sm:mt-20">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold tracking-tight">Frequently bought together</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {recommended.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="group rounded-2xl border bg-card overflow-hidden transition-colors hover:bg-muted"
          >
            <div className="aspect-square bg-muted relative overflow-hidden">
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.images[0].url}
                  alt={p.images[0].alt ?? p.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  —
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-sm line-clamp-1">{p.name}</h3>
              <p className="mt-1 font-semibold">${Number(p.price).toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
