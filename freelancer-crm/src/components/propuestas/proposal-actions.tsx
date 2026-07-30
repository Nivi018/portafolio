"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Download, Send, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateProposalStatus, convertProposalToInvoice } from "@/server/actions/proposals"

interface ProposalActionsProps {
  proposalId: string
  status: string
}

export function ProposalActions({ proposalId, status }: ProposalActionsProps) {
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  const handleDownload = () => {
    window.open(`/api/proposals/${proposalId}/pdf`, "_blank")
  }

  const handleSendEmail = async () => {
    setIsSending(true)
    try {
      const response = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Proposal sent to client")
        // Update status to SENT if it was DRAFT
        if (status === "DRAFT") {
          await updateProposalStatus(proposalId, "SENT")
          router.refresh()
        }
      } else {
        toast.error("Failed to send email")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsSending(false)
    }
  }

  const handleConvert = async () => {
    setIsConverting(true)
    try {
      const result = await convertProposalToInvoice(proposalId)
      toast.success("Proposal converted to invoice")
      router.push(`/invoices/${(result as { id: string }).id}`)
      router.refresh()
    } catch (error) {
      toast.error("Failed to convert proposal")
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/proposals/${proposalId}/editar`}>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </Link>
      <Button variant="outline" onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
      <Button variant="outline" onClick={handleSendEmail} disabled={isSending}>
        {isSending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Send Email
      </Button>
      {status === "ACCEPTED" && (
        <Button onClick={handleConvert} disabled={isConverting}>
          {isConverting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Convert to Invoice
        </Button>
      )}
    </div>
  )
}
