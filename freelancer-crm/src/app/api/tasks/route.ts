import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { taskSchema } from "@/lib/validators"

interface ZodError {
  name: string
  errors: { message: string }[]
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = taskSchema.parse(body)

    const task = await prisma.task.create({
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
        action: "created",
        entity: "task",
        entityId: task.id,
        metadata: JSON.stringify({ title: task.title }),
        userId: session.user.id,
        orgId: session.user.orgId,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Create task error:", error)

    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as unknown as ZodError
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}
