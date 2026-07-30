import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TicketPercent } from "lucide-react"
import { CouponForm } from "@/components/admin/coupon-form"
import { DeleteCouponButton } from "@/components/admin/delete-coupon-button"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Coupons" }

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
        <p className="text-sm text-muted-foreground">{coupons.length} coupons</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TicketPercent className="h-4 w-4" /> New coupon
          </h2>
          <CouponForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No coupons</p>
          ) : (
            <ul className="divide-y">
              {coupons.map((c) => (
                <li key={c.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono font-semibold">{c.code}</code>
                      {c.active ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      <Badge variant="secondary">
                        {c.type === "PERCENT" ? `${c.value}% off` : `$${c.value} off`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""} times
                      {c.minPurchase && Number(c.minPurchase) > 0 && ` · Min purchase $${c.minPurchase}`}
                      {c.expiresAt && ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CouponForm
                      coupon={{
                        id: c.id,
                        code: c.code,
                        type: c.type as "PERCENT" | "FIXED",
                        value: Number(c.value),
                        minPurchase: c.minPurchase ? Number(c.minPurchase) : null,
                        maxUses: c.maxUses,
                        expiresAt: c.expiresAt?.toISOString().slice(0, 10) ?? null,
                        active: c.active,
                      }}
                    />
                    <DeleteCouponButton id={c.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
