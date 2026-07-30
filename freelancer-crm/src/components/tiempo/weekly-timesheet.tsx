"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDuration } from "@/lib/utils"

interface TimeEntry {
  id: string
  description: string | null
  startTime: Date
  duration: number | null
  isRunning: boolean
  project: {
    id: string
    name: string
  }
  task: {
    id: string
    title: string
  } | null
}

interface WeeklyTimesheetProps {
  entries: TimeEntry[]
}

export function WeeklyTimesheet({ entries }: WeeklyTimesheetProps) {
  // Group entries by day
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  
  const groupedEntries = days.map((day, index) => {
    const dayEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return entryDate.getDay() === index
    })
    
    const totalDuration = dayEntries.reduce(
      (sum, entry) => sum + (entry.duration || 0),
      0
    )
    
    return {
      day,
      entries: dayEntries,
      total: totalDuration,
    }
  })

  const weekTotal = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Timesheet</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{formatDuration(weekTotal)}</span>
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groupedEntries.map(({ day, entries: dayEntries, total }) => (
            <div key={day} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/50">
                <h3 className="font-medium">{day}</h3>
                <span className="text-sm text-muted-foreground">
                  {formatDuration(total)}
                </span>
              </div>
              {dayEntries.length > 0 && (
                <div className="divide-y">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3"
                    >
                      <div>
                        <p className="text-sm">
                          {entry.description || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.project.name}
                          {entry.task && ` • ${entry.task.title}`}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {entry.isRunning ? (
                          <span className="text-green-600">Running...</span>
                        ) : entry.duration ? (
                          formatDuration(entry.duration)
                        ) : (
                          "-"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
