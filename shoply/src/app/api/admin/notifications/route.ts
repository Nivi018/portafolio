import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const key = getRateLimitKey(request, "admin-notifications")
  const rl = rateLimit(key, 60, 60_000) // 60 req/min
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  // Mark as read
  await prisma.adminNotification.updateMany({
    where: { read: false },
    data: { read: true },
  })

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  })
}
