"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { projectSchema, type ProjectInput } from "@/lib/validators"
import { createProject, updateProject } from "@/server/actions/projects"
import { getAllClients } from "@/server/queries/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
  email: string | null
  company: string | null
}

interface ProjectFormProps {
  initialData?: {
    id: string
    name: string
    description: string | null
    status: string
    priority: string
    budget: number | null
    hourlyRate: number | null
    startDate: Date | null
    deadline: Date | null
    clientId: string
  }
}

export function ProjectForm({ initialData }: ProjectFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      status: (initialData?.status as "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CANCELLED") || "PLANNING",
      priority: (initialData?.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") || "MEDIUM",
      budget: initialData?.budget || undefined,
      hourlyRate: initialData?.hourlyRate || undefined,
      startDate: initialData?.startDate
        ? new Date(initialData.startDate).toISOString().split("T")[0]
        : "",
      deadline: initialData?.deadline
        ? new Date(initialData.deadline).toISOString().split("T")[0]
        : "",
      clientId: initialData?.clientId || searchParams.get("clientId") || "",
    },
  })

  const status = watch("status")
  const priority = watch("priority")
  const clientId = watch("clientId")

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await getAllClients()
        setClients(data)
      } catch (error) {
        console.error("Failed to load clients:", error)
      }
    }
    loadClients()
  }, [])

  const onSubmit = async (data: ProjectInput) => {
    setIsLoading(true)

    try {
      if (initialData) {
        await updateProject(initialData.id, data)
        toast.success("Project updated successfully")
      } else {
        await createProject(data)
        toast.success("Project created successfully")
      }
      router.push("/projects")
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="Project name"
                disabled={isLoading}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Project description..."
                rows={3}
                disabled={isLoading}
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={clientId}
                onValueChange={(value) => setValue("clientId", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                      {client.company && ` (${client.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-destructive">{errors.clientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue("status", value as "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CANCELLED")}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setValue("priority", value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="0.00"
                disabled={isLoading}
                {...register("budget")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                placeholder="0.00"
                disabled={isLoading}
                {...register("hourlyRate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                disabled={isLoading}
                {...register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                disabled={isLoading}
                {...register("deadline")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Project" : "Create Project"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
