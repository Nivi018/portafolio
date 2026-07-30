import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, CheckCircle2, Clock, Download, FileText, MapPin, Package, Truck } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatOrderStatus, formatPrice } from "@/lib/format"
import type { Prisma } from "@/generated/prisma/client"

type Params = Promise<{ id: string }>

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: { include: { product: { include: { images: { take: 1 } } } } }
    address: true
  }
}>

const steps = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  PAID: "default",
  PROCESSING: "secondary",
  SHIPPED: "secondary",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
}

export default async function OrderDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const order: OrderWithRelations | null = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: { take: 1, orderBy: { position: "asc" } } } } } },
      address: true,
    },
  })

  if (!order || order.userId !== session.user.id) notFound()

  const hasDigital = order.items.some((item) => item.product.type === "DIGITAL")
  const currentStepIndex = steps.indexOf(order.status as (typeof steps)[number])
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED"

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link href="/account/orders" />}
        >
          <ArrowLeft />
          Back to orders
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={
            <a href={`/api/account/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer" />
          }
        >
          <FileText />
          Download invoice
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge variant={statusVariants[order.status] ?? "outline"} className="text-sm">
          {formatOrderStatus(order.status)}
        </Badge>
      </div>

      {/* Timeline */}
      {!isCancelled && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <ol className="flex items-center justify-between gap-2">
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIndex
                const isCurrent = idx === currentStepIndex
                return (
                  <li key={step} className="flex-1 flex flex-col items-center text-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx === 0 && <Clock className="h-4 w-4" />}
                      {idx === 1 && <CheckCircle2 className="h-4 w-4" />}
                      {idx === 2 && <Package className="h-4 w-4" />}
                      {idx === 3 && <Truck className="h-4 w-4" />}
                      {idx === 4 && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <p
                      className={`mt-2 text-xs font-medium ${
                        isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {formatOrderStatus(step)}
                    </p>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-medium line-clamp-1 hover:underline"
                    >
                      {item.productName}
                    </Link>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                    {item.product.type === "DIGITAL" && order.status !== "PENDING" && order.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        render={<Link href={`/digital/${order.id}`} />}
                      >
                        <Download />
                        Download
                      </Button>
                    )}
                  </div>
                  <p className="font-semibold tabular-nums shrink-0">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Shipping address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.address.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {order.address.street}, {order.address.city}, {order.address.state}{" "}
                  {order.address.zip}
                </p>
                <p className="text-sm text-muted-foreground">{order.address.country}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <aside>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span className="tabular-nums">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="tabular-nums">
                  {Number(order.shipping) === 0 ? "Free" : formatPrice(order.shipping)}
                </span>
              </div>
              {Number(order.tax) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">{formatPrice(order.tax)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
