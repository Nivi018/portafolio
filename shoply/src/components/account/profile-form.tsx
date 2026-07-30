"use client"

import { useState, useTransition } from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfileAction } from "@/server/actions/account"

type Props = {
  defaultName: string
  email: string
  memberSince: string
}

export function ProfileForm({ defaultName, email, memberSince }: Props) {
  const [name, setName] = useState(defaultName)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.length < 2) {
      toast.error("Name must be at least 2 characters")
      return
    }
    startTransition(async () => {
      const result = await updateProfileAction({ name })
      if (result.ok) {
        toast.success("Profile updated")
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={60}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Member since {new Date(memberSince).toLocaleDateString()}
        </p>
        <Button type="submit" disabled={isPending || name === defaultName}>
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Save changes
        </Button>
      </div>
    </form>
  )
}
