"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getProjects({
  search,
  status,
  clientId,
  page = 1,
  pageSize = 10,
}: {
  search?: string
  status?: string
  clientId?: string
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
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && status !== "ALL" && { status: status as any }),
    ...(clientId && { clientId }),
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        _count: {
          select: { tasks: true, invoices: true, timeEntries: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ])

  return {
    projects,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  }
}

export async function getProjectById(id: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      orgId: session.user.orgId,
    },
    include: {
      client: true,
      tasks: {
        orderBy: { createdAt: "desc" },
        include: { assignee: true },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
      timeEntries: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: true, task: true },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { tasks: true, invoices: true, timeEntries: true, proposals: true },
      },
    },
  })

  if (!project) {
    throw new Error("Project not found")
  }

  return project
}

export async function getProjectStats() {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const orgId = session.user.orgId

  const [total, planning, inProgress, review, completed, cancelled] = await Promise.all([
    prisma.project.count({ where: { orgId } }),
    prisma.project.count({ where: { orgId, status: "PLANNING" } }),
    prisma.project.count({ where: { orgId, status: "IN_PROGRESS" } }),
    prisma.project.count({ where: { orgId, status: "REVIEW" } }),
    prisma.project.count({ where: { orgId, status: "COMPLETED" } }),
    prisma.project.count({ where: { orgId, status: "CANCELLED" } }),
  ])

  return { total, planning, inProgress, review, completed, cancelled }
}

export async function getAllProjects() {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  return prisma.project.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      client: {
        select: { name: true },
      },
    },
  })
}
