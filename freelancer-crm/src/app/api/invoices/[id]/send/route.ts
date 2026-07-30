import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvoicePDF } from "@/components/pdf/invoice-pdf"
import { sendEmail, getInvoiceEmailTemplate, appUrl } from "@/lib/email"
import { formatCurrency, formatDate } from "@/lib/utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        project: { orgId: session.user.orgId },
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (!invoice.project.client.email) {
      return NextResponse.json(
        { error: "Client does not have an email address" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.orgId },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Generate PDF for attachment
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDF, { invoice, organization })
    )

    // Build email
    const html = getInvoiceEmailTemplate({
      clientName: invoice.project.client.name,
      invoiceNumber: invoice.number,
      total: formatCurrency(invoice.total),
      dueDate: formatDate(invoice.dueDate),
      organizationName: organization.name,
      invoiceUrl: `${appUrl}/invoices/${invoice.id}`,
    })

    // Send email
    const result = await sendEmail({
      to: invoice.project.client.email,
      subject: `Invoice ${invoice.number} from ${organization.name}`,
      html,
      attachments: [
        {
          filename: `invoice-${invoice.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      )
    }

    // Update invoice status to SENT if it was DRAFT
    if (invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT" },
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "sent",
        entity: "invoice",
        entityId: invoice.id,
        metadata: JSON.stringify({ email: invoice.project.client.email }),
        userId: session.user.id,
        orgId: session.user.orgId,
      },
    })

    return NextResponse.json({ message: "Invoice sent successfully" })
  } catch (error) {
    console.error("Send invoice error:", error)
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 }
    )
  }
}
