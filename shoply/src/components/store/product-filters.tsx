"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Category = { id: string; name: string; slug: string }

type Props = {
  categories: Category[]
  currentCategory?: string
  currentType?: "PHYSICAL" | "DIGITAL"
  currentMinPrice?: string
  currentMaxPrice?: string
  currentMinRating?: string
  activeCount: number
}

const TYPES = [
  { value: "PHYSICAL", label: "Physical" },
  { value: "DIGITAL", label: "Digital" },
] as const

const RATINGS = [
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
]

export function ProductFilters({
  categories,
  currentCategory,
  currentType,
  currentMinPrice,
  currentMaxPrice,
  currentMinRating,
  activeCount,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [minPrice, setMinPrice] = useState(currentMinPrice ?? "")
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice ?? "")

  function navigate(params: Record<string, string | null>) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v)
    })
    const qs = sp.toString()
    router.push(`/products${qs ? `?${qs}` : ""}`)
  }

  function getCurrent(exclude: string) {
    const sp = new URLSearchParams()
    if (currentCategory) sp.set("category", currentCategory)
    if (currentType) sp.set("type", currentType)
    if (currentMinPrice) sp.set("minPrice", currentMinPrice)
    if (currentMaxPrice) sp.set("maxPrice", currentMaxPrice)
    if (currentMinRating) sp.set("minRating", currentMinRating)
    sp.delete(exclude)
    return sp.toString()
  }

  function applyPrice() {
    const params: Record<string, string | null> = {
      category: currentCategory ?? null,
      type: currentType ?? null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      minRating: currentMinRating ?? null,
      page: null,
    }
    navigate(params)
  }

  return (
    <div className="space-y-6 lg:sticky lg:top-20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeCount}
            </Badge>
          )}
        </h3>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({})}
            className="text-muted-foreground"
          >
            <X />
            Clear
          </Button>
        )}
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Type</Label>
        <div className="space-y-1">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                navigate({
                  type: currentType === t.value ? null : t.value,
                  category: currentCategory ?? null,
                  minPrice: currentMinPrice ?? null,
                  maxPrice: currentMaxPrice ?? null,
                  minRating: currentMinRating ?? null,
                  page: null,
                })
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
                currentType === t.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Category</Label>
        <div className="space-y-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                navigate({
                  category: currentCategory === c.slug ? null : c.slug,
                  type: currentType ?? null,
                  minPrice: currentMinPrice ?? null,
                  maxPrice: currentMaxPrice ?? null,
                  minRating: currentMinRating ?? null,
                  page: null,
                })
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
                currentCategory === c.slug
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Price</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="h-9"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="h-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={applyPrice}
          disabled={isPending}
          className="w-full"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Apply
        </Button>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Min rating</Label>
        <div className="space-y-1">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                navigate({
                  minRating: currentMinRating === r.value ? null : r.value,
                  category: currentCategory ?? null,
                  type: currentType ?? null,
                  minPrice: currentMinPrice ?? null,
                  maxPrice: currentMaxPrice ?? null,
                  page: null,
                })
              }}
              className={cn(
                "flex w-full items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                currentMinRating === r.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
