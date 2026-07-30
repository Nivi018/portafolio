import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExportButton } from "@/components/shared/export-button"
import { Plus, CheckSquare, Clock, AlertCircle } from "lucide-react"
import { TaskActions } from "@/components/tareas/task-actions"

export default async function TasksPage() {
  const session = await auth()
  if (!session?.user?.orgId) {
    redirect("/login")
  }

  const orgId = session.user.orgId

  const [todoTasks, inProgressTasks, doneTasks] = await Promise.all([
    prisma.task.findMany({
      where: {
        project: { orgId },
        status: "TODO",
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
      ],
      include: {
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        project: { orgId },
        status: "IN_PROGRESS",
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
      ],
      include: {
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        project: { orgId },
        status: "DONE",
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
  ])

  const priorityColors: Record<string, string> = {
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks across all projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton type="tasks" label="Export CSV" />
          <Link href="/tasks/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="todo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todo" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            To Do ({todoTasks.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            In Progress ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Done ({doneTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo">
          <Card>
            <CardHeader>
              <CardTitle>To Do</CardTitle>
            </CardHeader>
            <CardContent>
              {todoTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks to do</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todoTasks.map((task) => (
                    <TaskActions
                      key={task.id}
                      task={task}
                      priorityColors={priorityColors}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress">
          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {inProgressTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks in progress</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {inProgressTasks.map((task) => (
                    <TaskActions
                      key={task.id}
                      task={task}
                      priorityColors={priorityColors}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="done">
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent>
              {doneTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed tasks</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doneTasks.map((task) => (
                    <TaskActions
                      key={task.id}
                      task={task}
                      priorityColors={priorityColors}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
