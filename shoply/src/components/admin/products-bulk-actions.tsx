"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, MoreHorizontal, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { bulkProductAction } from "@/server/actions/admin-bulk"
import { cn } from "@/lib/utils"

type Props = {
  products: { id: string; name: string; active: boolean; featured: boolean }[]
}

export function ProductsBulkActions({ products }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const allSelected = selected.size === products.length && products.length > 0
  const someSelected = selected.size > 0 && selected.size < products.length

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(products.map((p) => p.id)))
  }

  function handleAction(action: "activate" | "deactivate" | "delete" | "feature" | "unfeature") {
    if (action === "delete" && !confirm(`Delete ${selected.size} products? This cannot be undone.`)) {
      return
    }
    startTransition(async () => {
      const result = await bulkProductAction({
        ids: Array.from(selected),
        action,
      })
      if (result.ok) {
        toast.success(`${result.count} product(s) ${action}d`)
        setSelected(new Set())
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  if (products.length === 0) return null

  return (
    <div
      className={cn(
        "flex items-center gap-3 transition-opacity",
        selected.size === 0 ? "opacity-50" : "opacity-100",
      )}
    >
      <Checkbox
        checked={allSelected}
        indeterminate={someSelected}
        onCheckedChange={toggleAll}
        aria-label="Select all"
      />
      <span className="text-sm text-muted-foreground">
        {selected.size > 0 ? `${selected.size} selected` : "Select all"}
      </span>
      {selected.size > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("activate")}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            <Check />
            Activate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("deactivate")}
            disabled={isPending}
          >
            Deactivate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              handleAction(
                products.find((p) => selected.has(p.id) && !p.featured)
                  ? "feature"
                  : "unfeature",
              )
            }
            disabled={isPending}
          >
            Toggle featured
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction("delete")}
            disabled={isPending}
          >
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            <X />
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}
