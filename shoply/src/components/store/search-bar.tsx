"use client"

import Link from "next/link"
import { useState, useEffect, type ReactNode } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Suggestion = {
  id: string
  name: string
  slug: string
  price: number
  image?: string
  matchRanges?: Array<[number, number]>
}

function HighlightedText({ text, ranges }: { text: string; ranges?: Array<[number, number]> }): ReactNode {
  if (!ranges || ranges.length === 0) return text
  const parts: ReactNode[] = []
  let lastIdx = 0
  ranges.forEach(([start, end], i) => {
    if (start > lastIdx) parts.push(text.slice(lastIdx, start))
    parts.push(
      <mark key={i} className="bg-primary/20 text-foreground font-medium rounded px-0.5">
        {text.slice(start, end)}
      </mark>,
    )
    lastIdx = end
  })
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return <>{parts}</>
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const ctrl = new AbortController()
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setResults(data.results ?? [])
        }
      } catch {
        // ignore aborted
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products..."
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className={cn(
              "absolute z-50 mt-2 w-full rounded-xl border bg-popover shadow-lg overflow-hidden",
            )}
          >
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            )}
            {!loading && results.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No products found for &quot;{query}&quot;
              </div>
            )}
            {!loading && results.length > 0 && (
              <ul className="max-h-96 overflow-y-auto">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/products/${p.slug}`}
                      onClick={() => {
                        setOpen(false)
                        setQuery("")
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                    >
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          <HighlightedText text={p.name} ranges={p.matchRanges} />
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(p.price).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
