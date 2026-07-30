"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInvoiceNumber } from "@/lib/utils"
import { revalidatePath } from "next/cache"

interface InvoiceItemInput {
  description: string
  quantity: number
  unitPrice: number
}

interface CreateInvoiceInput {
  projectId: string
  status: string
  dueDate: string
  taxRate: number
  notes?: string
  items: InvoiceItemInput[]
}

export async function createInvoice(data: CreateInvoiceInput) {
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

  const invoice = await prisma.invoice.create({
    data: {
      number: generateInvoiceNumber(),
      status: data.status as any,
      dueDate: new Date(data.dueDate),
      subtotal,
      taxRate: data.taxRate,
      tax,
      total,
      notes: data.notes || null,
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
      entity: "invoice",
      entityId: invoice.id,
      metadata: JSON.stringify({ number: invoice.number }),
      userId: session.user.id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/invoices")
  return invoice
}

export async function updateInvoice(id: string, data: CreateInvoiceInput) {
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

  await prisma.invoiceItem.deleteMany({
    where: { invoiceId: id },
  })

  const invoice = await prisma.invoice.update({
    where: {
      id,
      project: { orgId: session.user.orgId },
    },
    data: {
      status: data.status as any,
      dueDate: new Date(data.dueDate),
      subtotal,
      taxRate: data.taxRate,
      tax,
      total,
      notes: data.notes || null,
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

  revalidatePath("/invoices")
  revalidatePath(`/invoices/${id}`)
  return invoice
}

export async function updateInvoiceStatus(id: string, status: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const updateData: any = { status: status as any }

  if (status === "PAID") {
    updateData.paidDate = new Date()
  }

  const invoice = await prisma.invoice.update({
    where: {
      id,
      project: { orgId: session.user.orgId },
    },
    data: updateData,
  })

  await prisma.activityLog.create({
    data: {
      action: "updated",
      entity: "invoice",
      entityId: invoice.id,
      metadata: JSON.stringify({ status }),
      userId: session.user.id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/invoices")
  revalidatePath(`/invoices/${id}`)
  return invoice
}

export async function deleteInvoice(id: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  await prisma.invoice.delete({
    where: {
      id,
      project: { orgId: session.user.orgId },
    },
  })

  revalidatePath("/invoices")
}
