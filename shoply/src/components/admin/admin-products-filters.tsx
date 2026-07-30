"use client"

import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
  currentType?: string
  currentQuery?: string
  categories: string[]
}

export function AdminProductsFilters({ currentType, currentQuery, categories }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(currentQuery ?? "")

  function navigate(params: Record<string, string | null>) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v)
    })
    router.push(`/admin/products?${sp.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ q, type: currentType ?? null, page: null })
        }}
        className="relative flex-1 min-w-48"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or SKU..."
          className="pl-9"
        />
      </form>
      <div className="flex gap-1">
        {[
          { value: "", label: "All" },
          { value: "PHYSICAL", label: "Physical" },
          { value: "DIGITAL", label: "Digital" },
        ].map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={(currentType ?? "") === t.value ? "default" : "outline"}
            onClick={() =>
              navigate({ type: t.value || null, q: currentQuery ?? null, page: null })
            }
          >
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
