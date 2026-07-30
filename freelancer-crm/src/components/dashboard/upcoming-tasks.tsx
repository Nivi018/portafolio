"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, getDaysUntil, isOverdue } from "@/lib/utils"
import { CalendarClock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  dueDate: Date | null
  priority: string
  status: string
  project: {
    name: string
  }
  assignee: {
    name: string | null
  } | null
}

interface UpcomingTasksProps {
  tasks: Task[]
}

const priorityColors: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No upcoming tasks. Create a project and add some tasks!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => {
            const overdue = task.dueDate && isOverdue(task.dueDate)
            const daysLeft = task.dueDate ? getDaysUntil(task.dueDate) : null

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  overdue && "border-destructive/50 bg-destructive/5"
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{task.title}</p>
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", priorityColors[task.priority])}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {task.project.name}
                    {task.assignee?.name && ` • ${task.assignee.name}`}
                  </p>
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      {overdue && <AlertCircle className="h-3 w-3 text-destructive" />}
                      <p
                        className={cn(
                          "text-xs",
                          overdue
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {overdue
                          ? `Overdue by ${Math.abs(daysLeft!)} days`
                          : daysLeft === 0
                          ? "Due today"
                          : daysLeft === 1
                          ? "Due tomorrow"
                          : `Due in ${daysLeft} days`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
