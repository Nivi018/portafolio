"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Download, Send, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateInvoiceStatus } from "@/server/actions/invoices"

interface InvoiceActionsProps {
  invoiceId: string
  status: string
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const handleDownload = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank")
  }

  const handleSendEmail = async () => {
    setIsSending(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Invoice sent to client")
        if (status === "DRAFT") {
          await updateInvoiceStatus(invoiceId, "SENT")
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

  const handleMarkAsPaid = async () => {
    setIsMarkingPaid(true)
    try {
      await updateInvoiceStatus(invoiceId, "PAID")
      toast.success("Invoice marked as paid")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update invoice")
    } finally {
      setIsMarkingPaid(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/invoices/${invoiceId}/editar`}>
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
      {status !== "PAID" && (
        <Button onClick={handleMarkAsPaid} disabled={isMarkingPaid}>
          {isMarkingPaid ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Mark as Paid
        </Button>
      )}
    </div>
  )
}
