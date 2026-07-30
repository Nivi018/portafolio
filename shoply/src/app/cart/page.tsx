import { redirect } from "next/navigation"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getCartTotals } from "@/server/actions/cart"
import { CartList } from "@/components/store/cart-list"
import { CartSummary } from "@/components/store/cart-summary"
import type { Prisma } from "@/generated/prisma/client"

export const metadata = { title: "Cart" }

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: { include: { images: { take: 1, orderBy: { position: "asc" } } } }
        variant: true
      }
    }
    coupon: true
  }
}>

export default async function CartPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?next=/cart")

  let cart: CartWithItems | null = null
  try {
    cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
            variant: true,
          },
          orderBy: { id: "asc" },
        },
        coupon: true,
      },
    })
  } catch {
    // DB not available
  }

  const totals = await getCartTotals()
  const isEmpty = !cart || cart.items.length === 0

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Add some products to get started.
        </p>
        <Button size="lg" className="mt-8" render={<Link href="/products" />}>
          Browse products
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
      </p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CartList
            items={cart!.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              product: {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                price: Number(item.product.price),
                type: item.product.type as "PHYSICAL" | "DIGITAL",
                image: item.product.images[0]?.url,
              },
              variant: item.variant
                ? {
                    id: item.variant.id,
                    name: item.variant.name,
                    value: item.variant.value,
                    priceAdj: Number(item.variant.priceAdj),
                    stock: item.variant.stock,
                  }
                : null,
            }))}
          />
        </div>

        <aside className="lg:col-span-1">
          <CartSummary
            subtotal={totals.subtotal}
            discount={totals.discount}
            shipping={totals.shipping}
            tax={totals.tax}
            total={totals.total}
            itemCount={totals.itemCount}
            appliedCoupon={
              cart?.coupon
                ? {
                    code: cart.coupon.code,
                    type: cart.coupon.type as "PERCENT" | "FIXED",
                    value: Number(cart.coupon.value),
                  }
                : null
            }
          />
        </aside>
      </div>
    </div>
  )
}
