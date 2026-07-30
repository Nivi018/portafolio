import { notFound } from "next/navigation"
import Link from "next/link"
import { getClientById } from "@/server/queries/clients"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials, formatCurrency } from "@/lib/utils"
import { Edit, Mail, Phone, Building2, MapPin, FolderKanban } from "lucide-react"
import { NoteSection } from "@/components/clientes/note-section"

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  LEAD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
}

const projectStatusColors: Record<string, string> = {
  PLANNING: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params

  let client
  try {
    client = await getClientById(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            {client.company && (
              <p className="text-muted-foreground">{client.company}</p>
            )}
          </div>
        </div>
        <Link href={`/clients/${id}/editar`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge className={statusColors[client.status]}>
              {client.status}
            </Badge>
            
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            
            {client.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.company}</span>
              </div>
            )}
            
            {client.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.address}</span>
              </div>
            )}

            {client.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Link href={`/projects/nuevo?clientId=${id}`}>
                <Button variant="outline" size="sm">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {client.projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No projects yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {client.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project._count.tasks} tasks • {project._count.invoices} invoices
                        </p>
                      </div>
                      <Badge className={projectStatusColors[project.status]}>
                        {project.status}
                      </Badge>
                    </div>
                    {project.budget && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Budget: {formatCurrency(project.budget)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <NoteSection clientId={id} notes={client.clientNotes} />
    </div>
  )
}
