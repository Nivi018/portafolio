import { notFound } from "next/navigation"
import Link from "next/link"
import { getProposalById } from "@/server/queries/proposals"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ProposalActions } from "@/components/propuestas/proposal-actions"

interface ProposalDetailPageProps {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  EXPIRED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
}

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const { id } = await params

  let proposal
  try {
    proposal = await getProposalById(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{proposal.title}</h1>
            <Badge className={statusColors[proposal.status]}>
              {proposal.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Project:{" "}
            <Link href={`/projects/${proposal.project.id}`} className="hover:underline">
              {proposal.project.name}
            </Link>
            {" • Client: "}
            {proposal.project.client.name}
          </p>
        </div>
        <ProposalActions proposalId={id} status={proposal.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Proposal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Proposal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={statusColors[proposal.status]}>
                {proposal.status}
              </Badge>
            </div>
            {proposal.validUntil && (
              <div>
                <p className="text-sm text-muted-foreground">Valid Until</p>
                <p className="font-medium">{formatDate(proposal.validUntil)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(proposal.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {proposal.content ? (
              <p className="text-muted-foreground whitespace-pre-wrap">{proposal.content}</p>
            ) : (
              <p className="text-muted-foreground italic">No description</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="w-24 text-right">Quantity</TableHead>
                <TableHead className="w-32 text-right">Unit Price</TableHead>
                <TableHead className="w-32 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposal.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="border-t mt-4 pt-4 space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(proposal.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({proposal.taxRate}%)</span>
              <span>{formatCurrency(proposal.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(proposal.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
