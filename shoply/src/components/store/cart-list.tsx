"use client"

import Link from "next/link"
import Image from "next/image"
import { Loader2, Minus, Plus, Trash2 } from "lucide-react"
import { useTransition, useOptimistic, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/server/actions/cart"
import { Badge } from "@/components/ui/badge"

type CartItem = {
  id: string
  productId: string
  variantId: string | null
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    type: "PHYSICAL" | "DIGITAL"
    image?: string
  }
  variant: {
    id: string
    name: string
    value: string
    priceAdj: number
    stock: number
  } | null
}

type Props = {
  items: CartItem[]
}

export function CartList({ items }: Props) {
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (
      state: CartItem[],
      action:
        | { type: "update"; id: string; quantity: number }
        | { type: "remove"; id: string },
    ) => {
      if (action.type === "remove") {
        return state.filter((i) => i.id !== action.id)
      }
      return state.map((i) =>
        i.id === action.id ? { ...i, quantity: Math.max(1, action.quantity) } : i,
      )
    },
  )

  return (
    <div className="space-y-3">
      {optimisticItems.map((item) => (
        <CartItemRow
          key={item.id}
          item={item}
          setOptimisticItems={setOptimisticItems}
        />
      ))}
    </div>
  )
}

function CartItemRow({
  item,
  setOptimisticItems,
}: {
  item: CartItem
  setOptimisticItems: (action: any) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState<"update" | "remove" | null>(null)
  const finalPrice = item.product.price + (item.variant?.priceAdj ?? 0)
  const lineTotal = finalPrice * item.quantity
  const maxQty = item.product.type === "DIGITAL" ? 10 : Math.max(1, item.variant?.stock ?? 99)

  function handleUpdate(newQty: number) {
    setBusy("update")
    setOptimisticItems({ type: "update", id: item.id, quantity: newQty })
    startTransition(async () => {
      const result = await updateCartItemAction(item.id, newQty)
      if (!result.ok) {
        toast.error(result.error ?? "Update failed")
      }
      setBusy(null)
    })
  }

  function handleRemove() {
    setBusy("remove")
    setOptimisticItems({ type: "remove", id: item.id })
    startTransition(async () => {
      const result = await removeCartItemAction(item.id)
      if (!result.ok) {
        toast.error(result.error ?? "Remove failed")
      } else {
        toast.success("Removed from cart")
      }
      setBusy(null)
    })
  }

  return (
    <div
      className={`flex gap-4 rounded-2xl border bg-card p-4 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-muted"
      >
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            sizes="120px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/products/${item.product.slug}`}
              className="font-medium hover:underline line-clamp-1"
            >
              {item.product.name}
            </Link>
            {item.variant && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.variant.name}: {item.variant.value}
                {item.variant.priceAdj !== 0 && (
                  <span className="ml-1">
                    ({item.variant.priceAdj > 0 ? "+" : ""}${item.variant.priceAdj.toFixed(2)})
                  </span>
                )}
              </p>
            )}
            {item.product.type === "DIGITAL" && (
              <Badge variant="secondary" className="mt-1.5">Digital</Badge>
            )}
          </div>

          <p className="font-semibold tabular-nums shrink-0">${lineTotal.toFixed(2)}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex items-center rounded-lg border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => handleUpdate(item.quantity - 1)}
              disabled={isPending || item.quantity <= 1}
              aria-label="Decrease"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-9 text-center text-sm tabular-nums">{item.quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => handleUpdate(item.quantity + 1)}
              disabled={isPending || item.quantity >= maxQty}
              aria-label="Increase"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            {busy === "remove" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Remove</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
