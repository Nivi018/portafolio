"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getInvoices({
  search,
  status,
  page = 1,
  pageSize = 10,
}: {
  search?: string
  status?: string
  page?: number
  pageSize?: number
} = {}) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const orgId = session.user.orgId

  const where = {
    project: { orgId },
    ...(search && {
      OR: [
        { number: { contains: search, mode: "insensitive" as const } },
        { project: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && status !== "ALL" && { status: status as any }),
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        project: {
          select: { id: true, name: true, client: { select: { name: true } } },
        },
        items: true,
      },
    }),
    prisma.invoice.count({ where }),
  ])

  return {
    invoices,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  }
}

export async function getInvoiceById(id: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

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
    throw new Error("Invoice not found")
  }

  return invoice
}

export async function getInvoiceStats() {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const orgId = session.user.orgId

  const [total, paid, sent, overdue, draft] = await Promise.all([
    prisma.invoice.findMany({ where: { project: { orgId } } }),
    prisma.invoice.findMany({ where: { project: { orgId }, status: "PAID" } }),
    prisma.invoice.findMany({ where: { project: { orgId }, status: "SENT" } }),
    prisma.invoice.findMany({ where: { project: { orgId }, status: "OVERDUE" } }),
    prisma.invoice.findMany({ where: { project: { orgId }, status: "DRAFT" } }),
  ])

  return {
    totalAmount: total.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: paid.reduce((sum, inv) => sum + inv.total, 0),
    sentAmount: sent.reduce((sum, inv) => sum + inv.total, 0),
    overdueAmount: overdue.reduce((sum, inv) => sum + inv.total, 0),
    draftAmount: draft.reduce((sum, inv) => sum + inv.total, 0),
    totalCount: total.length,
    paidCount: paid.length,
    sentCount: sent.length,
    overdueCount: overdue.length,
    draftCount: draft.length,
  }
}
