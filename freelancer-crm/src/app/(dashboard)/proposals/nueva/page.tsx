import { ProposalForm } from "@/components/propuestas/propuesta-form"

export default function NewProposalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Proposal</h1>
        <p className="text-muted-foreground">
          Create a new proposal for a client
        </p>
      </div>

      <ProposalForm />
    </div>
  )
}
