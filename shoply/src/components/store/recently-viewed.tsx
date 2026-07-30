import { cookies } from "next/headers"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

const RECENTLY_VIEWED_COOKIE = "shoply_recently_viewed"
const MAX_RECENT = 6

/**
 * Server component that shows products the user has recently viewed.
 * Uses a cookie to track recent product IDs (no PII).
 */
export async function RecentlyViewed({ currentSlug }: { currentSlug?: string }) {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(RECENTLY_VIEWED_COOKIE)?.value
  if (!cookieValue) return null

  const ids = cookieValue
    .split(",")
    .filter((id) => id && id !== currentSlug) // exclude current product
    .slice(0, MAX_RECENT)

  if (ids.length === 0) return null

  let products
  try {
    products = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
      include: { images: { take: 1, orderBy: { position: "asc" } } },
    })
  } catch {
    return null
  }

  // Preserve order from cookie
  products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))

  if (products.length === 0) return null

  return (
    <section className="mt-16 sm:mt-20">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold tracking-tight">Recently viewed</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((p) => (
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
            <div className="p-3">
              <h3 className="text-sm font-medium line-clamp-1">{p.name}</h3>
              <p className="text-sm font-semibold mt-1">${Number(p.price).toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
