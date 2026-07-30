import Link from "next/link"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Payment cancelled" }

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Card>
        <CardContent className="pt-10 pb-10 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 mb-6">
            <XCircle className="h-9 w-9 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Payment cancelled</h1>
          <p className="mt-2 text-muted-foreground">
            Your order was not completed. No charges have been made.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button render={<Link href="/checkout" />}>Try again</Button>
            <Button variant="outline" render={<Link href="/cart" />}>
              Back to cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
