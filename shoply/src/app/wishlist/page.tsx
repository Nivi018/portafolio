import Link from "next/link"
import { redirect } from "next/navigation"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { WishlistGrid } from "@/components/store/wishlist-grid"
import type { Prisma } from "@/generated/prisma/client"

export const metadata = { title: "Wishlist" }

type WishlistWithItems = Prisma.WishlistGetPayload<{
  include: {
    items: {
      include: {
        product: { include: { images: { take: 1, orderBy: { position: "asc" } } } }
      }
    }
  }
}>

export default async function WishlistPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?next=/wishlist")

  let wishlist: WishlistWithItems | null = null
  try {
    wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    })
  } catch {
    // DB not available
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
          <Heart className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Your wishlist is empty</h1>
        <p className="mt-3 text-muted-foreground">Save products you love for later.</p>
        <Button size="lg" className="mt-8" render={<Link href="/products" />}>
          Browse products
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {wishlist.items.length} {wishlist.items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>
      <WishlistGrid
        items={wishlist.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            price: Number(item.product.price),
            comparePrice: item.product.comparePrice ? Number(item.product.comparePrice) : null,
            type: item.product.type as "PHYSICAL" | "DIGITAL",
            stock: item.product.stock,
            image: item.product.images[0]?.url,
          },
        }))}
      />
    </div>
  )
}
