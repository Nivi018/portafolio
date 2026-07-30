import { notFound } from "next/navigation"
import Link from "next/link"
import { Truck, RefreshCw, Shield, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/auth"
import { ProductActions } from "@/components/store/product-actions"
import { ProductGallery } from "@/components/store/product-gallery"
import { ReviewsSection } from "@/components/store/reviews-section"
import { QuestionsSection } from "@/components/store/questions-section"
import { NotifyMeForm } from "@/components/store/notify-me-form"
import { RecentlyViewed } from "@/components/store/recently-viewed"
import { FrequentlyBoughtTogether } from "@/components/store/frequently-bought-together"
import { TrackProductView } from "@/components/store/track-product-view"
import { isInWishlist } from "@/server/actions/wishlist"
import { prisma } from "@/lib/prisma"
import { getProductBySlug, getRelatedProducts } from "@/server/queries/products"
import type { Prisma } from "@/generated/prisma/client"

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug).catch(() => null)
  if (!product) return { title: "Product not found" }

  return {
    title: product.name,
    description: product.shortDesc ?? product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDesc ?? product.description.slice(0, 160),
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [session, related, hasPurchased, questions] = await Promise.all([
    auth(),
    getRelatedProducts(product.id, product.categoryId),
    Promise.resolve(null), // Will be computed below
    prisma.productQuestion.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  let canReview = false
  if (session?.user?.id) {
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        items: { some: { productId: product.id } },
      },
      select: { id: true },
    })
    canReview = !!order
  }

  const inWishlist = session?.user?.id ? await isInWishlist(product.id) : false

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // Build JSON-LD structured data
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.sku ?? undefined,
    brand: { "@type": "Brand", name: "Shoply" },
    offers: {
      "@type": "Offer",
      price: Number(product.price),
      priceCurrency: "USD",
      availability:
        product.type === "DIGITAL" || product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviews.length > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount: product.reviews.length,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  }

  // Add individual reviews for rich snippets (max 5 most recent)
  if (product.reviews.length > 0) {
    jsonLd.review = product.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.user.name ?? "Anonymous" },
      datePublished: r.createdAt.toISOString(),
      reviewBody: r.comment,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
    }))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <TrackProductView productId={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        <span>/</span>
        <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Details */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {product.type === "DIGITAL" && (
                <Badge variant="secondary">Digital</Badge>
              )}
              {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                <Badge variant="destructive">Sale</Badge>
              )}
              {product.featured && <Badge>Featured</Badge>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{product.name}</h1>
            {product.shortDesc && (
              <p className="text-lg text-muted-foreground">{product.shortDesc}</p>
            )}
          </div>

          <ProductActions
            productId={product.id}
            name={product.name}
            price={Number(product.price)}
            comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
            stock={product.stock}
            type={product.type as "PHYSICAL" | "DIGITAL"}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              value: v.value,
              stock: v.stock,
              priceAdj: Number(v.priceAdj),
            }))}
            initialInWishlist={inWishlist}
            isAuthenticated={!!session?.user}
          />

          {/* Notify me when back in stock */}
          {product.type === "PHYSICAL" && product.stock === 0 && (
            <NotifyMeForm productId={product.id} />
          )}

          {/* Trust signals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t">
            {product.type === "PHYSICAL" ? (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span>Free shipping over $50</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span>30-day returns</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Secure checkout</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span>Instant download</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span>Lifetime access</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 sm:mt-16">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviews.length})</TabsTrigger>
            <TabsTrigger value="questions">Q&A ({questions.length})</TabsTrigger>
          </TabsList>
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({product.reviews.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6 max-w-3xl">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6 max-w-3xl">
            <ReviewsSection
              productId={product.id}
              reviews={product.reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt.toISOString(),
                approved: r.approved,
                adminResponse: r.adminResponse,
                user: r.user,
              }))}
              averageRating={averageRating}
              totalReviews={product.reviews.length}
              canReview={canReview}
            />
          </TabsContent>
          <TabsContent value="questions" className="mt-6 max-w-3xl">
            <QuestionsSection
              productId={product.id}
              questions={questions.map((q) => ({
                id: q.id,
                question: q.question,
                answer: q.answer,
                answeredAt: q.answeredAt?.toISOString() ?? null,
                createdAt: q.createdAt.toISOString(),
                user: { ...q.user, id: q.userId },
              }))}
              isAuthenticated={!!session?.user}
              currentUserId={session?.user?.id}
              isAdmin={session?.user?.role === "ADMIN"}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Recently viewed */}
      <RecentlyViewed currentSlug={product.slug} />

      {/* Frequently bought together */}
      <FrequentlyBoughtTogether productId={product.id} />

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16 sm:mt-20">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">You may also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group rounded-2xl border bg-card overflow-hidden transition-colors hover:bg-muted"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt={p.images[0].alt ?? p.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm line-clamp-1">{p.name}</h3>
                  <p className="mt-1 font-semibold text-sm">${Number(p.price).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
