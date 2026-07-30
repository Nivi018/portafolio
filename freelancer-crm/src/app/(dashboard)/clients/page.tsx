import { Suspense } from "react"
import Link from "next/link"
import { getClients } from "@/server/queries/clients"
import { ClientTable } from "@/components/clientes/cliente-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportButton } from "@/components/shared/export-button"
import { Plus } from "lucide-react"

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const status = params.status || "ALL"

  const { clients, total, totalPages } = await getClients({
    search,
    status,
    page,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton type="clients" label="Export CSV" />
          <Link href="/clients/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <ClientTable
          clients={clients}
          total={total}
          totalPages={totalPages}
          page={page}
        />
      </Suspense>
    </div>
  )
}
