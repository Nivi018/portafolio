"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserRoleAction } from "@/server/actions/admin-users"
import type { Role } from "@/generated/prisma/enums"

type Props = {
  userId: string
  currentRole: Role
}

export function UserRoleControl({ userId, currentRole }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState(currentRole)

  function handleChange(newRole: string) {
    if (!newRole) return
    setRole(newRole as Role)
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, newRole as Role)
      if (result.ok) {
        toast.success("Role updated")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
        setRole(currentRole)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onValueChange={(v) => v && handleChange(v)} disabled={isPending}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CLIENT">Client</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  )
}
