import { notFound } from "next/navigation"
import { getProjectById } from "@/server/queries/projects"
import { ProjectForm } from "@/components/proyectos/proyecto-form"

interface EditProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params

  let project
  try {
    project = await getProjectById(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
        <p className="text-muted-foreground">
          Update project information
        </p>
      </div>

      <ProjectForm
        initialData={{
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          budget: project.budget,
          hourlyRate: project.hourlyRate,
          startDate: project.startDate,
          deadline: project.deadline,
          clientId: project.clientId,
        }}
      />
    </div>
  )
}
