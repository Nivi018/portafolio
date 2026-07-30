"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDate } from "@/lib/utils"
import { MoreHorizontal, Edit, Trash2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  assignee: {
    id: string
    name: string | null
  } | null
}

interface TaskListProps {
  tasks: Task[]
  projectId?: string
}

const priorityColors: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function TaskList({ tasks, projectId }: TaskListProps) {
  const router = useRouter()
  const [optimisticTasks, setOptimisticTasks] = useState(tasks)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE"

    // Optimistic update
    setOptimisticTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    )

    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        // Revert on error
        setOptimisticTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: currentStatus } : t
          )
        )
        toast.error("Failed to update task")
      } else {
        toast.success(newStatus === "DONE" ? "Task completed" : "Task reopened")
        router.refresh()
      }
    } catch (error) {
      setOptimisticTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: currentStatus } : t
        )
      )
      toast.error("Something went wrong")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${deleteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Task deleted")
        setOptimisticTasks((prev) => prev.filter((t) => t.id !== deleteId))
        router.refresh()
      } else {
        toast.error("Failed to delete task")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (optimisticTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tasks yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {optimisticTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors",
              task.status === "DONE" && "opacity-60"
            )}
          >
            <Checkbox
              checked={task.status === "DONE"}
              onCheckedChange={() => handleToggleComplete(task.id, task.status)}
            />

            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium truncate",
                task.status === "DONE" && "line-through"
              )}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {task.description}
                </p>
              )}
            </div>

            <Badge
              variant="secondary"
              className={cn("text-xs", priorityColors[task.priority])}
            >
              {task.priority}
            </Badge>

            {task.dueDate && (
              <span className="text-xs text-muted-foreground">
                {formatDate(task.dueDate)}
              </span>
            )}

            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {task.assignee.name}
                </span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/tasks/${task.id}/editar`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteId(task.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
