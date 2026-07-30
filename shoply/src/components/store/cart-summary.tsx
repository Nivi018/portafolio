"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Check, Loader2, Tag, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { applyCouponAction, removeCouponAction } from "@/server/actions/cart"
import { cn } from "@/lib/utils"

type Props = {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  itemCount: number
  appliedCoupon: {
    code: string
    type: "PERCENT" | "FIXED"
    value: number
  } | null
}

export function CartSummary({
  subtotal,
  discount,
  shipping,
  tax,
  total,
  itemCount,
  appliedCoupon,
}: Props) {
  return (
    <div className="sticky top-20 space-y-4 rounded-2xl border bg-card p-6">
      <h2 className="font-semibold">Order summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>
              Discount
              {appliedCoupon && (
                <span className="ml-1 text-xs">({appliedCoupon.code})</span>
              )}
            </span>
            <span className="tabular-nums">-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="tabular-nums">
            {shipping === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">Free</span>
            ) : (
              `$${shipping.toFixed(2)}`
            )}
          </span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="tabular-nums">${tax.toFixed(2)}</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex justify-between font-semibold text-base">
        <span>Total</span>
        <span className="tabular-nums">${total.toFixed(2)}</span>
      </div>

      <CouponInput appliedCoupon={appliedCoupon} />

      <Button
        size="lg"
        className="w-full"
        disabled={itemCount === 0}
        render={<Link href="/checkout" />}
      >
        Checkout
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Taxes calculated at checkout
      </p>
    </div>
  )
}

function CouponInput({ appliedCoupon }: { appliedCoupon: Props["appliedCoupon"] }) {
  const [code, setCode] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await applyCouponAction(code)
      if (result.ok) {
        toast.success("Coupon applied!")
        setCode("")
      } else {
        setError(result.error ?? "Invalid coupon")
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeCouponAction()
      if (result.ok) {
        toast.success("Coupon removed")
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  if (appliedCoupon) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium truncate">{appliedCoupon.code}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            ({appliedCoupon.type === "PERCENT" ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`} off)
          </span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Remove coupon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleApply} className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Promo code"
            className="pl-8 h-9"
            disabled={isPending}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isPending || !code.trim()}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Try WELCOME10 or SAVE20</p>
    </form>
  )
}
