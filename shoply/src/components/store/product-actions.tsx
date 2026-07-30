"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Heart, Loader2, Minus, Plus, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { addToCartAction } from "@/server/actions/cart"
import { toggleWishlistAction } from "@/server/actions/wishlist"
import { addToCompare, removeFromCompare } from "@/server/actions/compare"
import { cn } from "@/lib/utils"

type Variant = {
  id: string
  name: string
  value: string
  stock: number
  priceAdj: number | { toString(): string }
}

type Props = {
  productId: string
  name: string
  price: number
  comparePrice?: number | string | null
  stock: number
  type: "PHYSICAL" | "DIGITAL"
  variants: Variant[]
  initialInWishlist: boolean
  isAuthenticated: boolean
}

export function ProductActions({
  productId,
  name,
  price,
  comparePrice,
  stock,
  type,
  variants,
  initialInWishlist,
  isAuthenticated,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdding, startAddTransition] = useTransition()
  const [isToggling, startWishlistTransition] = useTransition()
  const [inWishlist, setInWishlist] = useState(initialInWishlist)

  // Group variants by name (Size, Color, etc.)
  const variantGroups = variants.reduce<Record<string, Variant[]>>((acc, v) => {
    if (!acc[v.name]) acc[v.name] = []
    acc[v.name].push(v)
    return acc
  }, {})

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const name of Object.keys(variantGroups)) {
      init[name] = variantGroups[name][0]?.id ?? ""
    }
    return init
  })

  const [quantity, setQuantity] = useState(1)

  // Compute current variant (combination of all selected)
  const selectedVariants = Object.values(selected)
    .map((id) => variants.find((v) => v.id === id))
    .filter(Boolean) as Variant[]

  // For simple case (one variant group), use that variant
  const currentVariant = variants.length > 0 ? selectedVariants[0] : null
  const currentStock = currentVariant ? currentVariant.stock : stock
  const priceAdjustment = currentVariant ? Number(currentVariant.priceAdj) : 0
  const finalPrice = price + priceAdjustment

  const maxQuantity = type === "DIGITAL" ? 10 : Math.max(1, currentStock)
  const inStock = type === "DIGITAL" || currentStock > 0
  const lowStock = type === "PHYSICAL" && currentStock > 0 && currentStock <= 5

  function handleAdd() {
    if (!isAuthenticated) {
      router.push(`/login?next=/products/${name}`) // Will be overridden by proper slug in caller
      return
    }

    startAddTransition(async () => {
      const result = await addToCartAction({
        productId,
        variantId: currentVariant?.id ?? null,
        quantity,
      })
      if (result.ok) {
        toast.success(`Added ${quantity} × ${name} to cart`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to add to cart")
      }
    })
  }

  function handleWishlist() {
    if (!isAuthenticated) {
      router.push("/login?next=/wishlist")
      return
    }
    startWishlistTransition(async () => {
      const result = await toggleWishlistAction(productId)
      if (result.ok) {
        setInWishlist(result.added ?? false)
        toast.success(result.added ? "Added to wishlist" : "Removed from wishlist")
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold">${finalPrice.toFixed(2)}</span>
        {comparePrice && Number(comparePrice) > finalPrice && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              ${Number(comparePrice).toFixed(2)}
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Save ${(Number(comparePrice) - finalPrice).toFixed(2)}
            </span>
          </>
        )}
      </div>

      {/* Variants */}
      {Object.entries(variantGroups).map(([name, options]) => (
        <div key={name} className="space-y-2">
          <Label className="text-sm">
            {name}: <span className="font-normal text-muted-foreground">{options.find((o) => o.id === selected[name])?.value}</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const isSelected = selected[name] === option.id
              const outOfStock = option.stock === 0
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => setSelected((prev) => ({ ...prev, [name]: option.id }))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                    "hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background",
                  )}
                >
                  {option.value}
                  {outOfStock && <span className="ml-1 text-xs">(out)</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Stock indicator */}
      {type === "PHYSICAL" && (
        <div className="text-sm">
          {inStock ? (
            <span className={cn("font-medium", lowStock ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
              {lowStock ? `Only ${currentStock} left in stock` : "In stock"}
            </span>
          ) : (
            <span className="font-medium text-destructive">Out of stock</span>
          )}
        </div>
      )}
      {type === "DIGITAL" && (
        <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Instant download after purchase
        </div>
      )}

      {/* Quantity + Add to cart */}
      {inStock && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-r-none"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus />
            </Button>
            <span className="w-12 text-center text-sm font-medium tabular-nums">{quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-l-none"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              aria-label="Increase quantity"
            >
              <Plus />
            </Button>
          </div>

          <Button
            size="lg"
            onClick={handleAdd}
            disabled={isAdding}
            className="flex-1 sm:flex-none sm:min-w-48"
          >
            {isAdding ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
            Add to cart
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleWishlist}
            disabled={isToggling}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className="px-3"
          >
            {isToggling ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Heart className={cn(inWishlist && "fill-red-500 text-red-500")} />
            )}
          </Button>
        </div>
      )}

      {!inStock && (
        <Button size="lg" disabled className="w-full sm:w-auto">
          Out of stock
        </Button>
      )}

      {/* Compare button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          startTransition(async () => {
            await addToCompare(productId)
            toast.success("Added to compare")
            router.refresh()
          })
        }}
        disabled={isPending}
        className="self-start"
      >
        Add to compare
      </Button>
    </div>
  )
}
