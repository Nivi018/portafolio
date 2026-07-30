import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Download } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSignedDownloadUrl } from "@/lib/supabase"

type Params = Promise<{ orderId: string }>

export default async function DigitalDownloadsPage({ params }: { params: Params }) {
  const { orderId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/login?next=/digital/${orderId}`)

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
    },
  })

  if (!order || order.userId !== session.user.id) notFound()

  const downloadableStatuses = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]
  if (!downloadableStatuses.includes(order.status)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Downloads not available</h1>
        <p className="mt-3 text-muted-foreground">
          Your order is still {order.status.toLowerCase()}. Once your payment is confirmed, your
          downloads will be available here.
        </p>
        <Button className="mt-6" render={<Link href={`/account/orders/${order.id}`} />}>
          View order
        </Button>
      </div>
    )
  }

  const digitalItems = order.items.filter((item) => item.product.type === "DIGITAL")

  if (digitalItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">No digital products</h1>
        <p className="mt-3 text-muted-foreground">
          This order doesn&apos;t contain any digital products.
        </p>
        <Button className="mt-6" render={<Link href="/account/orders" />}>
          Back to orders
        </Button>
      </div>
    )
  }

  // Generate signed URLs for each digital item
  const downloads = await Promise.all(
    digitalItems.map(async (item) => {
      let url: string | null = null
      let error: string | null = null

      if (item.product.downloadUrl) {
        // The downloadUrl is stored as a path inside the "products" bucket
        url = await getSignedDownloadUrl("products", item.product.downloadUrl)
        if (!url) {
          error = "Download not yet configured. Contact support."
        }
      } else {
        error = "No file available for this product."
      }

      return { item, url, error }
    }),
  )

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Your downloads</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Order {order.orderNumber} — {digitalItems.length}{" "}
        {digitalItems.length === 1 ? "item" : "items"}
      </p>

      <div className="mt-8 space-y-3">
        {downloads.map(({ item, url, error }) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base">{item.productName}</CardTitle>
              {item.product.downloadLimit && (
                <CardDescription>
                  Download limit: {item.product.downloadLimit} times
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {url ? (
                <Button
                  className="w-full sm:w-auto"
                  render={<a href={url} download target="_blank" rel="noopener noreferrer" />}
                >
                  <Download />
                  Download
                </Button>
              ) : (
                <>
                  <Button className="w-full sm:w-auto" disabled>
                    <Download />
                    Download unavailable
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {error ?? "Contact support@shoply.dev for assistance."}
                  </p>
                </>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Links are valid for 1 hour. Generate a new one anytime by revisiting this page.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
