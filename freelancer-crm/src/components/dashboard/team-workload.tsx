"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { getInitials, formatDuration } from "@/lib/utils"
import { Users } from "lucide-react"

interface TeamMember {
  id: string
  name: string | null
  image: string | null
  role: string
  assignedTasks: { id: string }[]
  timeEntries: { duration: number | null }[]
}

interface TeamWorkloadProps {
  members: TeamMember[]
}

export function TeamWorkload({ members }: TeamWorkloadProps) {
  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No team members yet. Invite someone to your organization!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxTasks = Math.max(...members.map((m) => m.assignedTasks.length), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => {
            const totalHours = member.timeEntries.reduce(
              (sum, entry) => sum + (entry.duration || 0),
              0
            ) / 3600

            const workloadPercent = (member.assignedTasks.length / maxTasks) * 100

            return (
              <div key={member.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback>
                      {member.name ? getInitials(member.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {member.name || "Unknown"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {member.assignedTasks.length} tasks
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={workloadPercent} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {totalHours.toFixed(1)}h this week
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
