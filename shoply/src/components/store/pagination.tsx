"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  currentPage: number
  totalPages: number
  basePath: string
  searchParams: Record<string, string | undefined>
}

function buildHref(basePath: string, searchParams: Record<string, string | undefined>, page: number) {
  const sp = new URLSearchParams()
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v && k !== "page") sp.set(k, v)
  })
  if (page > 1) sp.set("page", String(page))
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ""}`
}

export function Pagination({ currentPage, totalPages, basePath, searchParams }: Props) {
  if (totalPages <= 1) return null

  // Build page list with ellipsis
  const pages: (number | "...")[] = []
  const add = (p: number | "...") => pages.push(p)
  const max = Math.min(totalPages, 7)
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i)
  } else {
    add(1)
    if (currentPage > 3) add("...")
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) add(i)
    if (currentPage < totalPages - 2) add("...")
    add(totalPages)
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-1 flex-wrap"
    >
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        render={<Link href={buildHref(basePath, searchParams, currentPage - 1)} aria-label="Previous page" />}
      >
        <ChevronLeft />
      </Button>
      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-sm">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="icon"
            className={cn(p === currentPage && "pointer-events-none")}
            render={<Link href={buildHref(basePath, searchParams, p)} aria-label={`Page ${p}`} aria-current={p === currentPage ? "page" : undefined} />}
          >
            {p}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === totalPages}
        render={<Link href={buildHref(basePath, searchParams, currentPage + 1)} aria-label="Next page" />}
      >
        <ChevronRight />
      </Button>
    </nav>
  )
}
