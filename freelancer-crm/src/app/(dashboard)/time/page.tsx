import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDuration, formatDate } from "@/lib/utils"
import { Clock, Timer, Calendar, BarChart3 } from "lucide-react"
import { LiveTimer } from "@/components/tiempo/live-timer"
import { ManualTimeEntry } from "@/components/tiempo/manual-time-entry"
import { WeeklyTimesheet } from "@/components/tiempo/weekly-timesheet"
import { ExportButton } from "@/components/shared/export-button"
import { TimeHistoryFilters } from "@/components/tiempo/time-history-filters"

interface TimePageProps {
  searchParams: Promise<{
    projectId?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function TimePage({ searchParams }: TimePageProps) {
  const session = await auth()
  if (!session?.user?.orgId) {
    redirect("/login")
  }

  const params = await searchParams
  const orgId = session.user.orgId
  const userId = session.user.id

  // Build date filter
  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (params.startDate) {
    dateFilter.gte = new Date(params.startDate)
  }
  if (params.endDate) {
    const endDate = new Date(params.endDate)
    endDate.setHours(23, 59, 59, 999)
    dateFilter.lte = endDate
  }

  // Get projects for the timer and filters
  const projects = await prisma.project.findMany({
    where: {
      orgId,
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      name: true,
      tasks: {
        where: { status: { not: "DONE" } },
        select: { id: true, title: true },
      },
    },
    orderBy: { name: "asc" },
  })

  // Get active timer
  const activeTimer = await prisma.timeEntry.findFirst({
    where: {
      userId,
      isRunning: true,
    },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  })

  // Get today's entries
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      project: { orgId },
      ...(params.projectId && { projectId: params.projectId }),
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { startTime: "desc" },
    include: {
      project: { select: { name: true } },
      task: { select: { title: true } },
    },
  })

  const todayTotal = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

  // Get this week's entries
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const weekEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      project: { orgId },
      ...(params.projectId && { projectId: params.projectId }),
      startTime: {
        gte: weekStart,
      },
    },
    orderBy: { startTime: "desc" },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  })

  const weekTotal = weekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

  // Get filtered history entries
  const hasFilters = params.projectId || params.startDate || params.endDate
  const historyEntries = hasFilters
    ? await prisma.timeEntry.findMany({
        where: {
          userId,
          project: { orgId },
          ...(params.projectId && { projectId: params.projectId }),
          ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter }),
        },
        orderBy: { startTime: "desc" },
        include: {
          project: { select: { name: true } },
          task: { select: { title: true } },
        },
      })
    : todayEntries

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track your time across projects
          </p>
        </div>
        <ExportButton type="time-entries" label="Export CSV" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Currently Tracking</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {activeTimer ? "Active" : "Not running"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatDuration(todayTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatDuration(weekTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timer" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timer" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="timesheet" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timesheet
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer">
          <LiveTimer
            projects={projects}
            activeTimer={activeTimer}
          />
        </TabsContent>

        <TabsContent value="manual">
          <ManualTimeEntry projects={projects} />
        </TabsContent>

        <TabsContent value="timesheet">
          <WeeklyTimesheet entries={weekEntries} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Time Entry History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TimeHistoryFilters projects={projects} />

              {historyEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No entries found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {entry.description || "No description"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.project.name}
                          {entry.task && ` • ${entry.task.title}`}
                        </p>
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
                          {formatDate(entry.startTime)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
