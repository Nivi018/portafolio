"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateOrderStatusAction } from "@/server/actions/admin-orders"

const STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const

type Props = {
  orderId: string
  currentStatus: string
}

export function OrderStatusControl({ orderId, currentStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus)

  function handleChange(newStatus: string) {
    setStatus(newStatus)
    startTransition(async () => {
      const result = await updateOrderStatusAction({
        orderId,
        status: newStatus as (typeof STATUSES)[number],
      })
      if (result.ok) {
        toast.success("Order status updated")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
        setStatus(currentStatus)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={(v) => v && handleChange(v)} disabled={isPending}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  )
}
