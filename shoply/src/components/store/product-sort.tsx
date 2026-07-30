"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "rating", label: "Top rated" },
] as const

type Sort = (typeof SORTS)[number]["value"]

export function ProductSort({ currentSort }: { currentSort: Sort }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSort(value: string) {
    if (!value) return
    const sp = new URLSearchParams(searchParams.toString())
    if (value === "newest") {
      sp.delete("sort")
    } else {
      sp.set("sort", value)
    }
    sp.delete("page")
    const qs = sp.toString()
    router.push(`/products${qs ? `?${qs}` : ""}`)
  }

  return (
    <Select value={currentSort} onValueChange={(v) => v && handleSort(v)}>
      <SelectTrigger className="w-48">
        <ArrowUpDown />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORTS.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
