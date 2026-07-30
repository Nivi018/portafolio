import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Check, X, GitCompare, Share2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CompareActions } from "@/components/store/compare-actions"
import { getCompareItems, loadSharedCompare } from "@/server/actions/compare"

type SearchParams = Promise<{ share?: string }>

export const metadata = {
  title: "Compare products",
  description: "Compare products side by side to find the perfect one for you.",
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  // If share link, load shared list
  if (params.share) {
    const shared = await loadSharedCompare(params.share)
    if (shared.length > 0) {
      // Hydrate the compare cookie with shared items
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      cookieStore.set(
        "shoply_compare",
        encodeURIComponent(JSON.stringify(shared)),
        {
          path: "/",
          maxAge: 60 * 60 * 24,
          sameSite: "lax",
        },
      )
      redirect("/compare")
    }
  }

  const items = await getCompareItems()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <GitCompare className="h-16 w-16 mx-auto mb-6 opacity-30" />
        <h1 className="text-3xl font-semibold tracking-tight">Nothing to compare yet</h1>
        <p className="mt-3 text-muted-foreground">
          Add products to compare and see them side by side.
        </p>
        <Button size="lg" className="mt-8" render={<Link href="/products" />}>
          Browse products
        </Button>
      </div>
    )
  }

  // Fetch full product data
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.id) }, active: true },
    include: {
      images: { take: 1, orderBy: { position: "asc" } },
      category: true,
      reviews: { select: { rating: true } },
    },
  })

  // Preserve order
  const ordered = items
    .map((i) => products.find((p) => p.id === i.id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  // Comparison rows
  const rows = [
    { label: "Price", render: (p: typeof ordered[number]) => `$${Number(p.price).toFixed(2)}` },
    {
      label: "Compare at",
      render: (p: typeof ordered[number]) =>
        p.comparePrice ? `$${Number(p.comparePrice).toFixed(2)}` : "—",
    },
    {
      label: "Category",
      render: (p: typeof ordered[number]) => p.category.name,
    },
    {
      label: "Type",
      render: (p: typeof ordered[number]) => p.type,
    },
    {
      label: "Stock",
      render: (p: typeof ordered[number]) =>
        p.stock > 0 ? `${p.stock} in stock` : "Out of stock",
    },
    {
      label: "SKU",
      render: (p: typeof ordered[number]) => p.sku ?? "—",
    },
    {
      label: "Rating",
      render: (p: typeof ordered[number]) => {
        if (p.reviews.length === 0) return "No reviews"
        const avg = p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
        return `★ ${avg.toFixed(1)} (${p.reviews.length})`
      },
    },
    {
      label: "Free shipping",
      render: (p: typeof ordered[number]) => (Number(p.price) >= 50 ? "✓" : "—"),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Compare products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? "product" : "products"} in your comparison
          </p>
        </div>
        <CompareActions itemIds={items.map((i) => i.id)} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header row with product images and names */}
          <thead>
            <tr>
              <th className="text-left p-3 w-32 align-top sticky left-0 bg-background z-10">
                <span className="text-sm text-muted-foreground">Feature</span>
              </th>
              {ordered.map((p) => (
                <th key={p.id} className="text-left p-3 min-w-56 align-top">
                  <Card>
                    <CardContent className="p-3">
                      <div className="relative aspect-square bg-muted rounded-md overflow-hidden mb-3">
                        {p.images[0] ? (
                          <Image
                            src={p.images[0].url}
                            alt={p.images[0].alt ?? p.name}
                            fill
                            sizes="200px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-1 right-1 h-6 w-6 bg-background/80"
                          render={
                            <form
                              action={async () => {
                                "use server"
                                const { removeFromCompare } = await import(
                                  "@/server/actions/compare"
                                )
                                await removeFromCompare(p.id)
                              }}
                            />
                          }
                          aria-label={`Remove ${p.name}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Link
                        href={`/products/${p.slug}`}
                        className="font-medium text-sm line-clamp-2 hover:underline"
                      >
                        {p.name}
                      </Link>
                      {p.comparePrice && Number(p.comparePrice) > Number(p.price) && (
                        <Badge variant="destructive" className="mt-1">
                          Sale
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t">
                <td className="p-3 font-medium text-sm sticky left-0 bg-background z-10">
                  {row.label}
                </td>
                {ordered.map((p) => (
                  <td key={p.id} className="p-3 text-sm text-muted-foreground">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t">
              <td className="p-3 sticky left-0 bg-background" />
              {ordered.map((p) => (
                <td key={p.id} className="p-3">
                  <Button size="sm" render={<Link href={`/products/${p.slug}`} />}>
                    View product
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
