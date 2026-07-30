"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2, Share2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { clearCompare, createCompareShareLink } from "@/server/actions/compare"

type Props = {
  itemIds: string[]
}

export function CompareActions({ itemIds }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClear() {
    if (!confirm("Clear all products from compare?")) return
    startTransition(async () => {
      await clearCompare()
      toast.success("Compare list cleared")
      router.refresh()
    })
  }

  function handleShare() {
    startTransition(async () => {
      const result = await createCompareShareLink({ itemIds, expiresInDays: 7 })
      if (result.ok) {
        const url = `${window.location.origin}${result.url}`
        try {
          await navigator.clipboard.writeText(url)
          toast.success("Share link copied to clipboard!")
        } catch {
          toast.success(`Link created: ${url}`)
        }
      } else {
        toast.error(result.error ?? "Failed to create link")
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleShare}
        disabled={isPending || itemIds.length === 0}
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
        Share
      </Button>
      <Button size="sm" variant="outline" onClick={handleClear} disabled={isPending}>
        <Trash2 className="h-3 w-3" />
        Clear all
      </Button>
    </div>
  )
}
