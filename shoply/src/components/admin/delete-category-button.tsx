"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteCategoryAction } from "@/server/actions/admin-categories"

export function DeleteCategoryButton({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Delete this category?")) return
    startTransition(async () => {
      const result = await deleteCategoryAction(id)
      if (result.ok) {
        toast.success("Category deleted")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleDelete}
      disabled={isPending}
      className="text-muted-foreground hover:text-destructive"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 />}
    </Button>
  )
}
