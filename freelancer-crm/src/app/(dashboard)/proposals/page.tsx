import { Suspense } from "react"
import Link from "next/link"
import { getProposals } from "@/server/queries/proposals"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportButton } from "@/components/shared/export-button"
import { Plus } from "lucide-react"
import { ProposalsTable } from "@/components/propuestas/proposals-table"

interface ProposalsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function ProposalsPage({ searchParams }: ProposalsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const status = params.status || "ALL"

  const { proposals, total, totalPages } = await getProposals({
    search,
    status,
    page,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground">
            Create and manage client proposals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton type="proposals" label="Export CSV" />
          <Link href="/proposals/nueva">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <ProposalsTable
          proposals={proposals}
          total={total}
          totalPages={totalPages}
          page={page}
        />
      </Suspense>
    </div>
  )
}
