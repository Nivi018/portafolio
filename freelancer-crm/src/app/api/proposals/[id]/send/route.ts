import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProposalPDF } from "@/components/pdf/proposal-pdf"
import { sendEmail, getProposalEmailTemplate, appUrl } from "@/lib/email"
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

    const proposal = await prisma.proposal.findFirst({
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

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    if (!proposal.project.client.email) {
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
      createElement(ProposalPDF, { proposal, organization })
    )

    // Build email
    const validUntil = proposal.validUntil
      ? formatDate(proposal.validUntil)
      : "30 days from now"

    const html = getProposalEmailTemplate({
      clientName: proposal.project.client.name,
      proposalTitle: proposal.title,
      total: formatCurrency(proposal.total),
      validUntil,
      organizationName: organization.name,
      proposalUrl: `${appUrl}/proposals/${proposal.id}`,
    })

    // Send email
    const result = await sendEmail({
      to: proposal.project.client.email,
      subject: `Proposal: ${proposal.title} from ${organization.name}`,
      html,
      attachments: [
        {
          filename: `proposal-${proposal.title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`,
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

    // Update proposal status to SENT if it was DRAFT
    if (proposal.status === "DRAFT") {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: "SENT" },
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "sent",
        entity: "proposal",
        entityId: proposal.id,
        metadata: JSON.stringify({ email: proposal.project.client.email }),
        userId: session.user.id,
        orgId: session.user.orgId,
      },
    })

    return NextResponse.json({ message: "Proposal sent successfully" })
  } catch (error) {
    console.error("Send proposal error:", error)
    return NextResponse.json(
      { error: "Failed to send proposal" },
      { status: 500 }
    )
  }
}
