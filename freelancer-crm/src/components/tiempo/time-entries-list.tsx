import { formatDuration, formatDateTime } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Clock } from "lucide-react"

interface TimeEntry {
  id: string
  description: string | null
  startTime: Date
  endTime: Date | null
  duration: number | null
  isRunning: boolean
  user: {
    id: string
    name: string | null
    image: string | null
  }
  task: {
    id: string
    title: string
  } | null
}

interface TimeEntriesListProps {
  entries: TimeEntry[]
}

export function TimeEntriesList({ entries }: TimeEntriesListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No time entries yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-4 p-3 border rounded-lg"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={entry.user.image || undefined} />
            <AvatarFallback>
              {entry.user.name ? getInitials(entry.user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {entry.description || "No description"}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{entry.user.name}</span>
              {entry.task && (
                <>
                  <span>•</span>
                  <span>{entry.task.title}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="font-medium">
              {entry.isRunning ? (
                <span className="text-green-600">Running...</span>
              ) : entry.duration ? (
                formatDuration(entry.duration)
              ) : (
                "-"
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(entry.startTime)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
