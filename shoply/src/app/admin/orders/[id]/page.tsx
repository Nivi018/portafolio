import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, MapPin, Package, User } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatOrderStatus, formatPrice } from "@/lib/format"
import { OrderStatusControl } from "@/components/admin/order-status-control"
import type { Prisma } from "@/generated/prisma/client"

type Params = Promise<{ id: string }>

type OrderFull = Prisma.OrderGetPayload<{
  include: {
    user: true
    address: true
    items: { include: { product: { include: { images: { take: 1 } } } } }
  }
}>

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return <div>Unauthorized</div>
  }

  const { id } = await params
  const order: OrderFull | null = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      items: { include: { product: { include: { images: { take: 1, orderBy: { position: "asc" } } } } } },
    },
  })

  if (!order) notFound()

  const customer = order.user

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" render={<Link href="/admin/orders" />}>
        <ArrowLeft />
        Back to orders
      </Button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleString("en-US", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
        </div>
        <OrderStatusControl orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.productName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-sm">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.address && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping address
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-0.5">
                <p className="font-medium">{order.address.fullName}</p>
                <p className="text-muted-foreground">{order.address.street}</p>
                <p className="text-muted-foreground">
                  {order.address.city}, {order.address.state} {order.address.zip}
                </p>
                <p className="text-muted-foreground">{order.address.country}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{customer.name ?? "—"}</p>
              <p className="text-muted-foreground">{customer.email}</p>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
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
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
              {order.stripePaymentIntentId && (
                <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
                  PI: {order.stripePaymentIntentId}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
