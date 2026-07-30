import Link from "next/link"
import { NewsletterForm } from "@/components/store/newsletter-form"

const links = {
  shop: [
    { href: "/products", label: "All products" },
    { href: "/products?type=PHYSICAL", label: "Physical" },
    { href: "/products?type=DIGITAL", label: "Digital" },
    { href: "/categories", label: "Categories" },
  ],
  account: [
    { href: "/account", label: "My account" },
    { href: "/account/orders", label: "Orders" },
    { href: "/wishlist", label: "Wishlist" },
    { href: "/cart", label: "Cart" },
  ],
  info: [
    { href: "#", label: "About" },
    { href: "#", label: "Shipping" },
    { href: "#", label: "Returns" },
    { href: "#", label: "Contact" },
  ],
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm">
                S
              </span>
              <span>Shoply</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Curated physical and digital products, delivered with care.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Shop</h3>
            <ul className="space-y-2 text-sm">
              {links.shop.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Account</h3>
            <ul className="space-y-2 text-sm">
              {links.account.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Info</h3>
            <ul className="space-y-2 text-sm">
              {links.info.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-base font-semibold">Stay in the loop</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get notified about new products, sales, and exclusive offers. No spam.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Shoply. All rights reserved.</p>
          <p>Built with Next.js, Prisma, Stripe & Cloudinary.</p>
        </div>
      </div>
    </footer>
  )
}
