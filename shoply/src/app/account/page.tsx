import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ProfileForm } from "@/components/account/profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Package, ShoppingBag } from "lucide-react"

export const metadata: Metadata = { title: "My account" }

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?next=/account")

  const [user, orderCount, addressCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.address.count({ where: { userId: session.user.id } }),
  ])

  if (!user) redirect("/login")

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">My account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your profile, addresses, and orders
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/account/orders"
          className="rounded-2xl border bg-card p-6 hover:bg-muted transition-colors"
        >
          <Package className="h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-2xl font-semibold">{orderCount}</p>
          <p className="text-sm text-muted-foreground">Orders</p>
        </Link>
        <Link
          href="/account/addresses"
          className="rounded-2xl border bg-card p-6 hover:bg-muted transition-colors"
        >
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-2xl font-semibold">{addressCount}</p>
          <p className="text-sm text-muted-foreground">Addresses</p>
        </Link>
        <Link
          href="/wishlist"
          className="rounded-2xl border bg-card p-6 hover:bg-muted transition-colors"
        >
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-2xl font-semibold">—</p>
          <p className="text-sm text-muted-foreground">Wishlist</p>
        </Link>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              defaultName={user.name ?? ""}
              email={user.email}
              memberSince={user.createdAt.toISOString()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
