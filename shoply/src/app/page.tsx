import Link from "next/link"
import { ArrowRight, ShoppingBag, Sparkles, Truck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Category } from "@/generated/prisma/client"
import { getFeaturedProducts, getAllCategories } from "@/server/queries/cached"

export default async function Home() {
  const [featuredRaw, categoriesRaw] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getAllCategories().catch(() => []),
  ])
  const featured = featuredRaw.slice(0, 4)
  const categories = categoriesRaw.slice(0, 6)

  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>New collection available</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight">
              Curated essentials,
              <br />
              <span className="text-muted-foreground">delivered.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Discover handpicked physical products and instantly downloadable digital goods.
              Free shipping on orders over $50.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/products" />}>
                Shop all
                <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/products?type=DIGITAL" />}>
                Browse digital
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-card p-6">
              <Truck className="h-5 w-5 mb-3" />
              <h3 className="font-semibold">Free shipping</h3>
              <p className="mt-1 text-sm text-muted-foreground">On orders over $50</p>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <Zap className="h-5 w-5 mb-3" />
              <h3 className="font-semibold">Instant downloads</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get digital products immediately</p>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <ShoppingBag className="h-5 w-5 mb-3" />
              <h3 className="font-semibold">Secure checkout</h3>
              <p className="mt-1 text-sm text-muted-foreground">Powered by Stripe</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-3xl font-semibold tracking-tight">Shop by category</h2>
              <Link href="/products" className="text-sm font-medium hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group flex flex-col items-center justify-center rounded-2xl border bg-card p-6 transition-colors hover:bg-muted"
                >
                  <span className="font-medium text-sm">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-3xl font-semibold tracking-tight">Featured</h2>
              <Link href="/products" className="text-sm font-medium hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
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
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                    <p className="mt-1 font-semibold">${Number(product.price).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
