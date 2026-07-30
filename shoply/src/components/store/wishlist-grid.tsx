"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useTransition, useOptimistic } from "react"
import { Heart, Loader2, ShoppingCart, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toggleWishlistAction } from "@/server/actions/wishlist"
import { addToCartAction } from "@/server/actions/cart"
import { cn } from "@/lib/utils"

type WishlistItem = {
  id: string
  productId: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    comparePrice: number | null
    type: "PHYSICAL" | "DIGITAL"
    stock: number
    image?: string
  }
}

type Props = {
  items: WishlistItem[]
}

export function WishlistGrid({ items }: Props) {
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (state: WishlistItem[], action: { type: "remove"; id: string }) =>
      state.filter((i) => i.id !== action.id),
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {optimisticItems.map((item) => (
        <WishlistCard
          key={item.id}
          item={item}
          setOptimisticItems={setOptimisticItems}
        />
      ))}
    </div>
  )
}

function WishlistCard({
  item,
  setOptimisticItems,
}: {
  item: WishlistItem
  setOptimisticItems: (action: any) => void
}) {
  const [isRemoving, startRemove] = useTransition()
  const [isAdding, startAdd] = useTransition()
  const { product } = item
  const inStock = product.type === "DIGITAL" || product.stock > 0
  const comparePrice = product.comparePrice
  const onSale = comparePrice !== null && comparePrice > product.price

  function handleRemove() {
    startRemove(async () => {
      setOptimisticItems({ type: "remove", id: item.id })
      const result = await toggleWishlistAction(item.productId)
      if (!result.ok) {
        toast.error(result.error ?? "Failed")
      } else {
        toast.success("Removed from wishlist")
      }
    })
  }

  function handleAddToCart() {
    startAdd(async () => {
      const result = await addToCartAction({
        productId: item.productId,
        variantId: null,
        quantity: 1,
      })
      if (result.ok) {
        toast.success("Added to cart")
      } else {
        toast.error(result.error ?? "Failed to add to cart")
      }
    })
  }

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card overflow-hidden transition-opacity",
        isRemoving && "opacity-50",
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className="block aspect-square bg-muted relative overflow-hidden"
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {onSale && (
          <Badge variant="destructive" className="absolute top-3 left-3">
            Sale
          </Badge>
        )}
        {!onSale && product.type === "DIGITAL" && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            Digital
          </Badge>
        )}
        {!onSale && product.type === "DIGITAL" && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            Digital
          </Badge>
        )}
      </Link>

      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-sm"
        onClick={handleRemove}
        disabled={isRemoving}
        aria-label="Remove from wishlist"
      >
        {isRemoving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </Button>

      <div className="p-4 space-y-3">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-medium line-clamp-1 hover:underline">{product.name}</h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">${product.price.toFixed(2)}</span>
          {onSale && comparePrice !== null && (
            <span className="text-sm text-muted-foreground line-through">
              ${comparePrice.toFixed(2)}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          size="sm"
          onClick={handleAddToCart}
          disabled={isAdding || !inStock}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          {inStock ? "Add to cart" : "Out of stock"}
        </Button>
      </div>
    </div>
  )
}
