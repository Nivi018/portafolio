import Link from "next/link"
import { CheckCircle2, Mail, Package } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Order confirmed" }

type SearchParams = Promise<{ payment_intent?: string; order?: string }>

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { payment_intent, order: orderId } = await searchParams
  const session = await auth()

  let order = null
  if (orderId && session?.user?.id) {
    order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
    })
  } else if (payment_intent) {
    order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: payment_intent },
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Card>
        <CardContent className="pt-10 pb-10 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 mb-6">
            <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Order confirmed!</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you for your purchase. We&apos;ve sent a confirmation email.
          </p>

          {order && (
            <div className="mt-6 inline-flex flex-col gap-1 rounded-lg border bg-muted/50 px-6 py-3">
              <span className="text-xs text-muted-foreground">Order number</span>
              <span className="font-mono font-semibold">{order.orderNumber}</span>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {order && (
              <Button render={<Link href={`/account/orders/${order.id}`} />}>
                <Package />
                View order
              </Button>
            )}
            <Button variant="outline" render={<Link href="/products" />}>
              Continue shopping
            </Button>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            A confirmation email will arrive shortly. Check your spam folder if you don&apos;t see it.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
