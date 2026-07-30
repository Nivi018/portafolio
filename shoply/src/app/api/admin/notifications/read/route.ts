import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Mark all as read
  await prisma.adminNotification.updateMany({
    where: { read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}
