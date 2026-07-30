import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        isRunning: true,
      },
    })

    if (!activeTimer) {
      return NextResponse.json(
        { error: "No active timer" },
        { status: 400 }
      )
    }

    const endTime = new Date()
    const duration = Math.floor(
      (endTime.getTime() - new Date(activeTimer.startTime).getTime()) / 1000
    )

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: activeTimer.id },
      data: {
        endTime,
        duration,
        isRunning: false,
      },
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Stop timer error:", error)
    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 }
    )
  }
}
