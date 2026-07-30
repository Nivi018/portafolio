import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AddressesManager } from "@/components/account/addresses-manager"

export const metadata: Metadata = { title: "Addresses" }

export default async function AddressesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?next=/account/addresses")

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Addresses</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your saved addresses for faster checkout
      </p>

      <div className="mt-8">
        <AddressesManager
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
        />
      </div>
    </div>
  )
}
