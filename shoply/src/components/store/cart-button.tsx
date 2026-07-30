import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getOrCreateGuestCartId } from "@/server/actions/guest-cart"

export async function CartButton() {
  const session = await auth()
  let count = 0

  try {
    let cart
    if (session?.user?.id) {
      cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: { items: { select: { quantity: true } } },
      })
    } else {
      const guestId = await getOrCreateGuestCartId()
      cart = await prisma.cart.findUnique({
        where: { guestId },
        include: { items: { select: { quantity: true } } },
      })
    }
    count = cart?.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) ?? 0
  } catch {
    // DB might not be available
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cart"
      className="relative"
      render={<Link href="/cart" />}
    >
      <ShoppingCart />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  )
}
