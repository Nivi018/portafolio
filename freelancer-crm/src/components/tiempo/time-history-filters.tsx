"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface Project {
  id: string
  name: string
}

interface TimeHistoryFiltersProps {
  projects: Project[]
}

export function TimeHistoryFilters({ projects }: TimeHistoryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const projectId = searchParams.get("projectId") || ""
  const startDate = searchParams.get("startDate") || ""
  const endDate = searchParams.get("endDate") || ""

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/time?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("/time")
  }

  const hasFilters = projectId || startDate || endDate

  return (
    <div className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-2">
        <Label>Project</Label>
        <Select
          value={projectId || "all"}
          onValueChange={(value) => updateFilters("projectId", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">From</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => updateFilters("startDate", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">To</Label>
        <Input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => updateFilters("endDate", e.target.value)}
        />
      </div>

      <div className="flex items-end">
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
