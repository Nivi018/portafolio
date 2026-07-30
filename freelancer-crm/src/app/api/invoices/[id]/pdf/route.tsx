import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvoicePDF } from "@/components/pdf/invoice-pdf"
import { createElement } from "react"

export async function GET(
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

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.orgId },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDF, { invoice, organization })
    )

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Generate PDF error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
