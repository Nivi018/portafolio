"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GitCompare, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { addToCompare, removeFromCompare } from "@/server/actions/compare"

type Props = {
  productId: string
  productName: string
  productSlug: string
  inCompare: boolean
  compareCount: number
  maxCompare?: number
}

export function CompareButton({
  productId,
  productName,
  productSlug,
  inCompare,
  compareCount,
  maxCompare = 4,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      if (inCompare) {
        const result = await removeFromCompare(productId)
        if (result.items) {
          toast.success("Removed from compare")
          router.refresh()
        }
      } else {
        if (compareCount >= maxCompare) {
          toast.error(`You can compare up to ${maxCompare} products`)
          return
        }
        const result = await addToCompare(productId)
        if (result.items) {
          toast.success("Added to compare")
          router.refresh()
        }
      }
    })
  }

  return (
    <Button
      type="button"
      variant={inCompare ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <GitCompare className="h-3.5 w-3.5" />
      )}
      {inCompare ? "In compare" : "Compare"}
    </Button>
  )
}
