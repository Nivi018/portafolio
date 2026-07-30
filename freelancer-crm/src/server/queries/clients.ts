"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getClients({
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
    orgId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { company: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && status !== "ALL" && { status: status as any }),
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { projects: true },
        },
      },
    }),
    prisma.client.count({ where }),
  ])

  return {
    clients,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  }
}

export async function getClientById(id: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const client = await prisma.client.findFirst({
    where: {
      id,
      orgId: session.user.orgId,
    },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { tasks: true, invoices: true },
          },
        },
      },
      clientNotes: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!client) {
    throw new Error("Client not found")
  }

  return client
}

export async function getClientStats() {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const orgId = session.user.orgId

  const [total, active, inactive, leads] = await Promise.all([
    prisma.client.count({ where: { orgId } }),
    prisma.client.count({ where: { orgId, status: "ACTIVE" } }),
    prisma.client.count({ where: { orgId, status: "INACTIVE" } }),
    prisma.client.count({ where: { orgId, status: "LEAD" } }),
  ])

  return { total, active, inactive, leads }
}

export async function getAllClients() {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  return prisma.client.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
    },
  })
}
