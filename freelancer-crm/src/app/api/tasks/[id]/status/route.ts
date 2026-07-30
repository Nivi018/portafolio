import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Verify task belongs to user's org
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: { orgId: session.user.orgId },
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Update task status error:", error)
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    )
  }
}
