"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, Loader2, MoreHorizontal, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteProductAction, toggleProductActiveAction } from "@/server/actions/admin-products"

type Props = {
  productId: string
  active: boolean
}

export function ProductRowActions({ productId, active }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<"toggle" | "delete" | null>(null)

  async function handleToggle() {
    setBusy("toggle")
    const result = await toggleProductActiveAction(productId)
    if (result.ok) {
      toast.success(active ? "Product deactivated" : "Product activated")
      router.refresh()
    } else {
      toast.error(result.error ?? "Failed")
    }
    setBusy(null)
  }

  async function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return
    setBusy("delete")
    const result = await deleteProductAction(productId)
    if (result.ok) {
      toast.success("Product deleted")
      router.refresh()
    } else {
      toast.error(result.error ?? "Failed")
    }
    setBusy(null)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" disabled={busy !== null}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal />}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href={`/admin/products/${productId}`} />}>
          <Eye />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggle}>
          <Power />
          {active ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} variant="destructive">
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
