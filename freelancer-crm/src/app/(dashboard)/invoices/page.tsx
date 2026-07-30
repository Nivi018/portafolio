import { Suspense } from "react"
import Link from "next/link"
import { getInvoices, getInvoiceStats } from "@/server/queries/invoices"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportButton } from "@/components/shared/export-button"
import { Plus, DollarSign, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { InvoicesTable } from "@/components/facturas/invoices-table"
import { formatCurrency } from "@/lib/utils"

interface InvoicesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const status = params.status || "ALL"

  const [{ invoices, total, totalPages }, stats] = await Promise.all([
    getInvoices({ search, status, page }),
    getInvoiceStats(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your client invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton type="invoices" label="Export CSV" />
          <Link href="/invoices/nueva">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalAmount)}</p>
            <p className="text-xs text-muted-foreground">{stats.totalCount} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Paid</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(stats.paidAmount)}</p>
            <p className="text-xs text-muted-foreground">{stats.paidCount} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(stats.sentAmount)}</p>
            <p className="text-xs text-muted-foreground">{stats.sentCount} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Overdue</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(stats.overdueAmount)}</p>
            <p className="text-xs text-muted-foreground">{stats.overdueCount} invoices</p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <InvoicesTable
          invoices={invoices}
          total={total}
          totalPages={totalPages}
          page={page}
        />
      </Suspense>
    </div>
  )
}
