"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const STATUSES = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
]

export function AdminOrdersFilters({
  currentStatus,
  currentQuery,
}: {
  currentStatus?: string
  currentQuery?: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(currentQuery ?? "")

  function navigate(params: Record<string, string | null>) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v)
    })
    router.push(`/admin/orders?${sp.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ q, status: currentStatus ?? null, page: null })
        }}
        className="relative flex-1 min-w-48"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order #, name, or email..."
          className="pl-9"
        />
      </form>
      <div className="flex gap-1 overflow-x-auto">
        {STATUSES.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={(currentStatus ?? "") === s.value ? "default" : "outline"}
            onClick={() => navigate({ status: s.value || null, q: currentQuery ?? null, page: null })}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
