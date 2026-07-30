import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TaskForm } from "@/components/tareas/task-form"

export default async function NewTaskPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">New Task</h1>
        <p className="text-muted-foreground">
          Create a new task for a project
        </p>
      </div>

      <TaskForm projects={projects} teamMembers={teamMembers} />
    </div>
  )
}
