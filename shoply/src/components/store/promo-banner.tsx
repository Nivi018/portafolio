import Link from "next/link"
import { Sparkles, Truck } from "lucide-react"
import { prisma } from "@/lib/prisma"

export async function PromoBanner() {
  const now = new Date()
  const banner = await prisma.promoBanner
    .findFirst({
      where: {
        active: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => null)

  if (!banner) {
    // Fallback to a hardcoded shipping banner
    return (
      <div className="border-b bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 text-center text-sm flex items-center justify-center gap-2">
          <Truck className="h-4 w-4" />
          <span>
            Free shipping on orders over $50 ·
            <Link href="/register" className="font-medium underline ml-1">
              Sign up for 10% off your first order
            </Link>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 text-center text-sm flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span>
          <strong>{banner.title}</strong> · {banner.message}
          {banner.cta && banner.ctaUrl && (
            <Link href={banner.ctaUrl} className="font-medium underline ml-1">
              {banner.cta}
            </Link>
          )}
        </span>
      </div>
    </div>
  )
}
