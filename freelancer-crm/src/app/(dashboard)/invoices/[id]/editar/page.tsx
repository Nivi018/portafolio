import { notFound } from "next/navigation"
import { getInvoiceById } from "@/server/queries/invoices"
import { InvoiceForm } from "@/components/facturas/factura-form"

interface EditInvoicePageProps {
  params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params

  let invoice
  try {
    invoice = await getInvoiceById(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
        <p className="text-muted-foreground">
          Update invoice information
        </p>
      </div>

      <InvoiceForm
        initialData={{
          id: invoice.id,
          projectId: invoice.projectId,
          status: invoice.status,
          dueDate: invoice.dueDate,
          taxRate: invoice.taxRate,
          notes: invoice.notes,
          items: invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }}
      />
    </div>
  )
}
