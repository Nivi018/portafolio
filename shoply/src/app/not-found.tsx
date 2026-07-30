import Link from "next/link"
import { Home, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:py-32 text-center">
      <p className="text-7xl font-bold tracking-tight text-muted-foreground">404</p>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" render={<Link href="/" />}>
          <Home />
          Back to home
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/products" />}>
          <Search />
          Browse products
        </Button>
      </div>
    </div>
  )
}
