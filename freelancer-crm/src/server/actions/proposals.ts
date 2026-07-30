"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

interface ProposalItemInput {
  description: string
  quantity: number
  unitPrice: number
}

interface CreateProposalInput {
  title: string
  content?: string
  status: string
  validUntil?: string
  projectId: string
  taxRate: number
  items: ProposalItemInput[]
}

export async function createProposal(data: CreateProposalInput) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const tax = subtotal * (data.taxRate / 100)
  const total = subtotal + tax

  const proposal = await prisma.proposal.create({
    data: {
      title: data.title,
      content: data.content || null,
      status: data.status as any,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      subtotal,
      taxRate: data.taxRate,
      tax,
      total,
      projectId: data.projectId,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: { items: true },
  })

  await prisma.activityLog.create({
    data: {
      action: "created",
      entity: "proposal",
      entityId: proposal.id,
      metadata: JSON.stringify({ title: proposal.title }),
      userId: session.user.id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/proposals")
  return proposal
}

export async function updateProposal(id: string, data: CreateProposalInput) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const tax = subtotal * (data.taxRate / 100)
  const total = subtotal + tax

  // Delete existing items and create new ones
  await prisma.proposalItem.deleteMany({
    where: { proposalId: id },
  })

  const proposal = await prisma.proposal.update({
    where: {
      id,
      project: { orgId: session.user.orgId },
    },
    data: {
      title: data.title,
      content: data.content || null,
      status: data.status as any,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      subtotal,
      taxRate: data.taxRate,
      tax,
      total,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: { items: true },
  })

  revalidatePath("/proposals")
  revalidatePath(`/proposals/${id}`)
  return proposal
}

export async function updateProposalStatus(id: string, status: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const proposal = await prisma.proposal.update({
    where: {
      id,
      project: { orgId: session.user.orgId },
    },
    data: { status: status as any },
  })

  revalidatePath("/proposals")
  revalidatePath(`/proposals/${id}`)
  return proposal
}

export async function deleteProposal(id: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  await prisma.proposal.delete({
    where: {
      id,
      project: { orgId: session.user.orgId },
    },
  })

  revalidatePath("/proposals")
}

export async function convertProposalToInvoice(proposalId: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      project: { orgId: session.user.orgId },
    },
    include: {
      items: true,
      project: true,
    },
  })

  if (!proposal) {
    throw new Error("Proposal not found")
  }

  // Generate invoice number
  const invoiceCount = await prisma.invoice.count({
    where: { project: { orgId: session.user.orgId } },
  })
  const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, "0")}`

  // Create invoice from proposal
  const invoice = await prisma.invoice.create({
    data: {
      number: invoiceNumber,
      status: "DRAFT",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotal: proposal.subtotal,
      taxRate: proposal.taxRate,
      tax: proposal.tax,
      total: proposal.total,
      projectId: proposal.projectId,
      items: {
        create: proposal.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
  })

  // Update proposal status
  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "ACCEPTED" },
  })

  await prisma.activityLog.create({
    data: {
      action: "created",
      entity: "invoice",
      entityId: invoice.id,
      metadata: JSON.stringify({ fromProposal: proposal.title }),
      userId: session.user.id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/proposals")
  revalidatePath("/invoices")
  return invoice
}
