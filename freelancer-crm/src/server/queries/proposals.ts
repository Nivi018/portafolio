"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getProposals({
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
        { title: { contains: search, mode: "insensitive" as const } },
        { project: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && status !== "ALL" && { status: status as any }),
  }

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
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
    prisma.proposal.count({ where }),
  ])

  return {
    proposals,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  }
}

export async function getProposalById(id: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

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
    throw new Error("Proposal not found")
  }

  return proposal
}
