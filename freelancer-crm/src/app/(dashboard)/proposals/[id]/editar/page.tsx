import { notFound } from "next/navigation"
import { getProposalById } from "@/server/queries/proposals"
import { ProposalForm } from "@/components/propuestas/propuesta-form"

interface EditProposalPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProposalPage({ params }: EditProposalPageProps) {
  const { id } = await params

  let proposal
  try {
    proposal = await getProposalById(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Proposal</h1>
        <p className="text-muted-foreground">
          Update proposal information
        </p>
      </div>

      <ProposalForm
        initialData={{
          id: proposal.id,
          title: proposal.title,
          content: proposal.content,
          status: proposal.status,
          validUntil: proposal.validUntil,
          projectId: proposal.projectId,
          taxRate: proposal.taxRate,
          items: proposal.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }}
      />
    </div>
  )
}
