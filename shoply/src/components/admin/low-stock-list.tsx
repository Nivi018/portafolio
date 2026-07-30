"use client"

import Link from "next/link"
import { Package } from "lucide-react"

type Item = { id: string; name: string; stock: number }

export function LowStockList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
        <Package className="h-6 w-6 opacity-50" />
        All products are well-stocked
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-2 text-sm border-b pb-2 last:border-0"
        >
          <Link
            href={`/admin/products/${item.id}`}
            className="line-clamp-1 hover:underline flex-1"
          >
            {item.name}
          </Link>
          <span
            className={`text-xs font-semibold tabular-nums ${
              item.stock === 0 ? "text-destructive" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {item.stock} left
          </span>
        </li>
      ))}
    </ul>
  )
}
