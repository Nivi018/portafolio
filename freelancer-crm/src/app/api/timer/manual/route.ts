import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { description, projectId, taskId, date, hours } = body

    const startTime = new Date(date)
    startTime.setHours(9, 0, 0, 0) // Default to 9 AM

    const endTime = new Date(startTime)
    endTime.setSeconds(endTime.getSeconds() + Math.round(hours * 3600))

    const duration = Math.round(hours * 3600)

    const timeEntry = await prisma.timeEntry.create({
      data: {
        description: description || null,
        startTime,
        endTime,
        duration,
        isRunning: false,
        projectId,
        taskId: taskId || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Manual time entry error:", error)
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 }
    )
  }
}
