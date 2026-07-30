"use client"

import { useState, useTransition } from "react"
import { Bell, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { subscribeToStockNotification } from "@/server/actions/engagement"

type Props = {
  productId: string
}

export function NotifyMeForm({ productId }: Props) {
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await subscribeToStockNotification({ productId, email })
      if (result.ok) {
        toast.success("We'll notify you when it's back in stock!")
        setSubmitted(true)
        setEmail("")
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4 text-sm flex items-center gap-2">
        <Check className="h-4 w-4 text-emerald-600" />
        <span>You&apos;ll be notified when this is back in stock.</span>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border bg-muted/40 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Bell className="h-4 w-4" />
        Notify me when available
      </div>
      <p className="text-xs text-muted-foreground">
        Enter your email and we&apos;ll let you know when this product is back in stock.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="h-9"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Notify me
        </Button>
      </div>
    </form>
  )
}
