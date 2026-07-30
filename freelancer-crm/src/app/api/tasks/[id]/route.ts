import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { taskSchema } from "@/lib/validators"

interface ZodError {
  name: string
  errors: { message: string }[]
}

export async function PUT(
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
    const validatedData = taskSchema.parse(body)

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
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        status: validatedData.status,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        estimatedHours: validatedData.estimatedHours || null,
        projectId: validatedData.projectId,
        assigneeId: validatedData.assigneeId || null,
      },
    })

    await prisma.activityLog.create({
      data: {
        action: "updated",
        entity: "task",
        entityId: task.id,
        metadata: JSON.stringify({ title: task.title }),
        userId: session.user.id,
        orgId: session.user.orgId,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Update task error:", error)

    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as unknown as ZodError
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

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

    await prisma.task.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Task deleted" })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    )
  }
}
