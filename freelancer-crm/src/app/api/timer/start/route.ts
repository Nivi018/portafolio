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
    const { description, projectId, taskId } = body

    // Stop any running timer first
    await prisma.timeEntry.updateMany({
      where: {
        userId: session.user.id,
        isRunning: true,
      },
      data: {
        isRunning: false,
        endTime: new Date(),
        duration: 0, // Will be calculated
      },
    })

    // Calculate duration for stopped timers
    const stoppedEntries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        isRunning: false,
        duration: 0,
        endTime: { not: null },
      },
    })

    for (const entry of stoppedEntries) {
      if (entry.endTime) {
        const duration = Math.floor(
          (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000
        )
        await prisma.timeEntry.update({
          where: { id: entry.id },
          data: { duration },
        })
      }
    }

    // Start new timer
    const timeEntry = await prisma.timeEntry.create({
      data: {
        description: description || null,
        startTime: new Date(),
        isRunning: true,
        projectId,
        taskId: taskId || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Start timer error:", error)
    return NextResponse.json(
      { error: "Failed to start timer" },
      { status: 500 }
    )
  }
}
