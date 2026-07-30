"use client"

import { useState, useTransition } from "react"
import { Check, Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { subscribeToNewsletter } from "@/server/actions/engagement"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await subscribeToNewsletter({ email })
      if (result.ok) {
        toast.success("Thanks for subscribing!")
        setSubmitted(true)
        setEmail("")
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-emerald-600" />
        <span>You&apos;re subscribed. Welcome aboard!</span>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="pl-9 h-10"
          aria-label="Email for newsletter"
        />
      </div>
      <Button type="submit" disabled={isPending} size="default">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Subscribe
      </Button>
    </form>
  )
}
