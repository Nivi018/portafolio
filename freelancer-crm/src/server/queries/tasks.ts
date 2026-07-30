"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getTaskById(id: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const task = await prisma.task.findFirst({
    where: {
      id,
      project: { orgId: session.user.orgId },
    },
    include: {
      project: true,
      assignee: true,
    },
  })

  if (!task) {
    throw new Error("Task not found")
  }

  return task
}
