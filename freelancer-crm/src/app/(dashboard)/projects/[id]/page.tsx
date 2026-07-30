import { notFound } from "next/navigation"
import Link from "next/link"
import { getProjectById } from "@/server/queries/projects"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate, formatCurrency, formatDuration } from "@/lib/utils"
import { Edit, Calendar, DollarSign, Clock, CheckSquare, FileText, Receipt } from "lucide-react"
import { TaskList } from "@/components/tareas/task-list"
import { TimeEntriesList } from "@/components/tiempo/time-entries-list"

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
  PLANNING: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const priorityColors: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params

  let project
  try {
    project = await getProjectById(id)
  } catch {
    notFound()
  }

  const completedTasks = project.tasks.filter((t) => t.status === "DONE").length
  const totalTasks = project.tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const totalTime = project.timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

  const totalInvoiced = project.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={statusColors[project.status]}>
              {project.status.replace("_", " ")}
            </Badge>
            <Badge className={priorityColors[project.priority]}>
              {project.priority}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Client:{" "}
            <Link href={`/clients/${project.client.id}`} className="hover:underline">
              {project.client.name}
            </Link>
            {project.client.company && ` (${project.client.company})`}
          </p>
        </div>
        <Link href={`/projects/${id}/editar`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Progress</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{progress}%</p>
              <Progress value={progress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {completedTasks} of {totalTasks} tasks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Budget</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {project.budget ? formatCurrency(project.budget) : "N/A"}
              </p>
              {project.budget && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(totalInvoiced)} invoiced
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Time Tracked</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{formatDuration(totalTime)}</p>
              {project.hourlyRate && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency((totalTime / 3600) * project.hourlyRate)} earned
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Deadline</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {project.deadline ? formatDate(project.deadline) : "N/A"}
              </p>
              {project.deadline && (
                <p className="text-xs text-muted-foreground">
                  {new Date(project.deadline) > new Date() ? "Upcoming" : "Overdue"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks ({project._count.tasks})
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time ({project._count.timeEntries})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoices ({project._count.invoices})
          </TabsTrigger>
          <TabsTrigger value="proposals" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Proposals ({project._count.proposals})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tasks</CardTitle>
                <Link href={`/tasks/nuevo?projectId=${id}`}>
                  <Button size="sm">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <TaskList tasks={project.tasks} projectId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Time Entries</CardTitle>
                <Link href={`/time?projectId=${id}`}>
                  <Button size="sm">
                    <Clock className="mr-2 h-4 w-4" />
                    Track Time
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <TimeEntriesList entries={project.timeEntries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoices</CardTitle>
                <Link href={`/invoices/nuevo?projectId=${id}`}>
                  <Button size="sm">
                    <Receipt className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {project.invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No invoices yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.total)}</p>
                        <Badge
                          variant="secondary"
                          className={
                            invoice.status === "PAID"
                              ? "bg-green-100 text-green-800"
                              : invoice.status === "OVERDUE"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Proposals</CardTitle>
                <Link href={`/proposals/nuevo?projectId=${id}`}>
                  <Button size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Create Proposal
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {project.proposals.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No proposals yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.proposals.map((proposal) => (
                    <Link
                      key={proposal.id}
                      href={`/proposals/${proposal.id}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">{proposal.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {proposal.validUntil
                            ? `Valid until: ${formatDate(proposal.validUntil)}`
                            : "No expiration"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(proposal.total)}</p>
                        <Badge
                          variant="secondary"
                          className={
                            proposal.status === "ACCEPTED"
                              ? "bg-green-100 text-green-800"
                              : proposal.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : proposal.status === "SENT"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {proposal.status}
                        </Badge>
                      </div>
                    </Link>
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
