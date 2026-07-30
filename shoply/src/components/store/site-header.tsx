import Link from "next/link"
import { auth } from "@/auth"
import { CartButton } from "@/components/store/cart-button"
import { SearchBar } from "@/components/store/search-bar"
import { UserMenu } from "@/components/store/user-menu"
import { WishlistButton } from "@/components/store/wishlist-button"
import { PromoBanner } from "@/components/store/promo-banner"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export async function SiteHeader() {
  const session = await auth()
  const user = session?.user

  return (
    <>
      <PromoBanner />
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm">
              S
            </span>
            <span>Shoply</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
              Shop
            </Link>
            <Link href="/products?type=DIGITAL" className="text-muted-foreground hover:text-foreground transition-colors">
              Digital
            </Link>
            <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
              Categories
            </Link>
          </nav>

          <div className="hidden md:flex flex-1 justify-center">
            <SearchBar />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <WishlistButton />
            <CartButton />
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="ml-1"
                render={<Link href="/login" />}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>

        <div className="md:hidden pb-3">
          <SearchBar />
        </div>
      </div>
    </header>
    </>
  )
}
