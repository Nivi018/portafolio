import { Suspense } from "react"
import Link from "next/link"
import { getProjects } from "@/server/queries/projects"
import { ProjectTable } from "@/components/proyectos/proyecto-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportButton } from "@/components/shared/export-button"
import { Plus } from "lucide-react"

interface ProjectsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const status = params.status || "ALL"

  const { projects, total, totalPages } = await getProjects({
    search,
    status,
    page,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your client projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton type="projects" label="Export CSV" />
          <Link href="/projects/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <ProjectTable
          projects={projects}
          total={total}
          totalPages={totalPages}
          page={page}
        />
      </Suspense>
    </div>
  )
}
