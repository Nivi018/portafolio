"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Play, Square, Pause } from "lucide-react"
import { toast } from "sonner"

interface Project {
  id: string
  name: string
  tasks: {
    id: string
    title: string
  }[]
}

interface ActiveTimer {
  id: string
  description: string | null
  startTime: Date
  project: {
    id: string
    name: string
  }
  task: {
    id: string
    title: string
  } | null
}

interface LiveTimerProps {
  projects: Project[]
  activeTimer: ActiveTimer | null
}

export function LiveTimer({ projects, activeTimer }: LiveTimerProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(!!activeTimer)
  const [elapsed, setElapsed] = useState(0)
  const [description, setDescription] = useState(activeTimer?.description || "")
  const [selectedProject, setSelectedProject] = useState(activeTimer?.project.id || "")
  const [selectedTask, setSelectedTask] = useState(activeTimer?.task?.id || "")
  const [isLoading, setIsLoading] = useState(false)

  const selectedProjectData = projects.find((p) => p.id === selectedProject)

  // Update elapsed time
  useEffect(() => {
    if (!isRunning || !activeTimer) return

    const startTime = new Date(activeTimer.startTime).getTime()
    
    const updateElapsed = () => {
      const now = Date.now()
      setElapsed(Math.floor((now - startTime) / 1000))
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [isRunning, activeTimer])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const handleStart = async () => {
    if (!selectedProject) {
      toast.error("Please select a project")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          projectId: selectedProject,
          taskId: selectedTask || null,
        }),
      })

      if (response.ok) {
        setIsRunning(true)
        setElapsed(0)
        toast.success("Timer started")
        router.refresh()
      } else {
        toast.error("Failed to start timer")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/timer/stop", {
        method: "POST",
      })

      if (response.ok) {
        setIsRunning(false)
        setElapsed(0)
        setDescription("")
        toast.success("Timer stopped")
        router.refresh()
      } else {
        toast.error("Failed to stop timer")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Timer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-6xl font-mono font-bold tabular-nums">
            {formatTime(elapsed)}
          </div>
          {isRunning && activeTimer && (
            <p className="text-sm text-muted-foreground mt-2">
              {activeTimer.project.name}
              {activeTimer.task && ` • ${activeTimer.task.title}`}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">What are you working on?</Label>
            <Input
              id="description"
              placeholder="Describe your work..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isRunning}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
                disabled={isRunning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Task (optional)</Label>
              <Select
                value={selectedTask}
                onValueChange={setSelectedTask}
                disabled={isRunning || !selectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No task</SelectItem>
                  {selectedProjectData?.tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            {isRunning ? (
              <Button
                size="lg"
                variant="destructive"
                onClick={handleStop}
                disabled={isLoading}
                className="w-full max-w-xs"
              >
                <Square className="mr-2 h-5 w-5" />
                Stop Timer
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleStart}
                disabled={isLoading || !selectedProject}
                className="w-full max-w-xs"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Timer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
