"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "@/lib/format"
import { pusherClient } from "@/lib/pusher-client"
import Link from "next/link"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

type Props = {
  initialCount: number
}

export function AdminNotificationsBell({ initialCount }: Props) {
  const [count, setCount] = useState(initialCount)
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!pusherClient) return
    const channel = pusherClient.subscribe("admin")
    channel.bind("new-order", () => {
      setCount((c) => c + 1)
    })
    channel.bind("low-stock", () => {
      setCount((c) => c + 1)
    })
    return () => {
      pusherClient?.unsubscribe("admin")
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetch("/api/admin/notifications")
        .then((r) => r.json())
        .then((data) => setItems(data.notifications ?? []))
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          />
        }
      >
        <Bell />
        {count > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-4 px-1 text-[10px]"
          >
            {count > 9 ? "9+" : count}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">Notifications</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <li
                  key={n.id}
                  className="px-3 py-2 border-b last:border-0 hover:bg-muted transition-colors"
                >
                  <Link href="/admin/orders" onClick={() => setOpen(false)}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(n.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
