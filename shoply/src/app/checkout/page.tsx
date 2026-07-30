import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"
import { computeCartTotals } from "@/lib/pricing"

export const metadata = { title: "Checkout" }

export default async function CheckoutPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?next=/checkout")

  const [cart, addresses] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
            variant: true,
          },
        },
        coupon: true,
      },
    }),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ])

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Add some products before checking out.</p>
        <Button size="lg" className="mt-8" render={<Link href="/products" />}>
          Browse products
        </Button>
      </div>
    )
  }

  const totals = computeCartTotals(
    cart.items.map((item) => ({
      price: Number(item.product.price) + Number(item.variant?.priceAdj ?? 0),
      quantity: item.quantity,
    })),
    cart.coupon
      ? {
          type: cart.coupon.type,
          value: Number(cart.coupon.value),
        }
      : null,
  )

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>

      <CheckoutForm
        addresses={addresses.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          street: a.street,
          city: a.city,
          state: a.state,
          zip: a.zip,
          country: a.country,
          isDefault: a.isDefault,
        }))}
        items={cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          variantName: item.variant?.value ?? null,
          quantity: item.quantity,
          price: Number(item.product.price) + Number(item.variant?.priceAdj ?? 0),
          image: item.product.images?.[0]?.url,
        }))}
        totals={totals}
        appliedCoupon={
          cart.coupon
            ? {
                code: cart.coupon.code,
                type: cart.coupon.type as "PERCENT" | "FIXED",
                value: Number(cart.coupon.value),
              }
            : null
        }
      />
    </div>
  )
}
