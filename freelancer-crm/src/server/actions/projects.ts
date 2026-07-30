"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { projectSchema, type ProjectInput } from "@/lib/validators"
import { revalidatePath } from "next/cache"

export async function createProject(data: ProjectInput) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const validatedData = projectSchema.parse(data)

  const project = await prisma.project.create({
    data: {
      name: validatedData.name,
      description: validatedData.description || null,
      status: validatedData.status,
      priority: validatedData.priority,
      budget: validatedData.budget || null,
      hourlyRate: validatedData.hourlyRate || null,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
      clientId: validatedData.clientId,
      orgId: session.user.orgId,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "created",
      entity: "project",
      entityId: project.id,
      metadata: JSON.stringify({ name: project.name }),
      userId: session.user.id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/projects")
  return project
}

export async function updateProject(id: string, data: ProjectInput) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const validatedData = projectSchema.parse(data)

  const project = await prisma.project.update({
    where: {
      id,
      orgId: session.user.orgId,
    },
    data: {
      name: validatedData.name,
      description: validatedData.description || null,
      status: validatedData.status,
      priority: validatedData.priority,
      budget: validatedData.budget || null,
      hourlyRate: validatedData.hourlyRate || null,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
      clientId: validatedData.clientId,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "updated",
      entity: "project",
      entityId: project.id,
      metadata: JSON.stringify({ name: project.name }),
      userId: session.user.id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/projects")
  revalidatePath(`/projects/${id}`)
  return project
}

export async function deleteProject(id: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  await prisma.project.delete({
    where: {
      id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/projects")
}

export async function updateProjectStatus(id: string, status: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const project = await prisma.project.update({
    where: {
      id,
      orgId: session.user.orgId,
    },
    data: { status: status as any },
  })

  await prisma.activityLog.create({
    data: {
      action: "updated",
      entity: "project",
      entityId: project.id,
      metadata: JSON.stringify({ status }),
      userId: session.user.id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/projects")
  revalidatePath(`/projects/${id}`)
  return project
}
