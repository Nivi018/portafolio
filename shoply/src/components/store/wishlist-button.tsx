import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WishlistButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Wishlist"
      render={<Link href="/wishlist" />}
    >
      <Heart />
    </Button>
  )
}
