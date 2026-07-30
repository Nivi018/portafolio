"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatDateTime } from "@/lib/utils"
import { Activity, UserPlus, FolderPlus, CheckCircle, FileText, DollarSign } from "lucide-react"

interface ActivityItem {
  id: string
  action: string
  entity: string
  entityId: string
  metadata: string | null
  user: {
    name: string | null
    image: string | null
  } | null
  createdAt: Date
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const actionIcons: Record<string, any> = {
  created: UserPlus,
  updated: Activity,
  completed: CheckCircle,
  invoiced: DollarSign,
  proposed: FileText,
}

const actionLabels: Record<string, string> = {
  created: "created",
  updated: "updated",
  completed: "completed",
  invoiced: "invoiced",
  proposed: "proposed",
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No recent activity yet. Start by adding a client or project!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = actionIcons[activity.action] || Activity
            const label = actionLabels[activity.action] || activity.action

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user?.image || undefined} />
                  <AvatarFallback>
                    {activity.user?.name ? getInitials(activity.user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user?.name || "User"}</span>
                    {" "}{label}{" "}
                    <span className="font-medium">{activity.entity}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
