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
  status: string
  priority: string
  dueDate: Date | null
  project: { name: string }
  assignee: { id: string; name: string | null } | null
}

interface TaskActionsProps {
  task: Task
  priorityColors: Record<string, string>
}

export function TaskActions({ task, priorityColors }: TaskActionsProps) {
  const router = useRouter()
  const [optimisticStatus, setOptimisticStatus] = useState(task.status)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleComplete = async () => {
    const newStatus = optimisticStatus === "DONE" ? "TODO" : "DONE"
    const previousStatus = optimisticStatus

    setOptimisticStatus(newStatus)

    try {
      const response = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(newStatus === "DONE" ? "Task completed" : "Task reopened")
        router.refresh()
      } else {
        setOptimisticStatus(previousStatus)
        toast.error("Failed to update task")
      }
    } catch (error) {
      setOptimisticStatus(previousStatus)
      toast.error("Something went wrong")
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Task deleted")
        setDeleteOpen(false)
        router.refresh()
      } else {
        toast.error("Failed to delete task")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors",
          optimisticStatus === "DONE" && "opacity-60"
        )}
      >
        <Checkbox
          checked={optimisticStatus === "DONE"}
          onCheckedChange={handleToggleComplete}
        />

        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate",
            optimisticStatus === "DONE" && "line-through"
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{task.project.name}</span>
            {task.assignee && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
              </>
            )}
          </div>
          {task.dueDate && (
            <p className="text-xs text-muted-foreground mt-1">
              Due: {formatDate(task.dueDate)}
            </p>
          )}
        </div>

        <Badge
          variant="secondary"
          className={cn("text-xs", priorityColors[task.priority])}
        >
          {task.priority}
        </Badge>

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
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
