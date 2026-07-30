import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getTaskById } from "@/server/queries/tasks"
import { TaskForm } from "@/components/tareas/task-form"

interface EditTaskPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params

  let task
  try {
    task = await getTaskById(id)
  } catch {
    notFound()
  }

  const session = await auth()
  if (!session?.user?.orgId) {
    redirect("/login")
  }

  const [projects, teamMembers] = await Promise.all([
    prisma.project.findMany({
      where: {
        orgId: session.user.orgId,
        status: { not: "CANCELLED" },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { orgId: session.user.orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Task</h1>
        <p className="text-muted-foreground">
          Update task information
        </p>
      </div>

      <TaskForm
        projects={projects}
        teamMembers={teamMembers}
        initialData={{
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          estimatedHours: task.estimatedHours,
          projectId: task.projectId,
          assigneeId: task.assigneeId,
        }}
      />
    </div>
  )
}
