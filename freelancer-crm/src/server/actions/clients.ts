"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clientSchema, type ClientInput } from "@/lib/validators"
import { revalidatePath } from "next/cache"

export async function createClient(data: ClientInput) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const validatedData = clientSchema.parse(data)

  const client = await prisma.client.create({
    data: {
      ...validatedData,
      orgId: session.user.orgId,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "created",
      entity: "client",
      entityId: client.id,
      metadata: JSON.stringify({ name: client.name }),
      userId: session.user.id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/clients")
  return client
}

export async function updateClient(id: string, data: ClientInput) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const validatedData = clientSchema.parse(data)

  const client = await prisma.client.update({
    where: {
      id,
      orgId: session.user.orgId,
    },
    data: validatedData,
  })

  await prisma.activityLog.create({
    data: {
      action: "updated",
      entity: "client",
      entityId: client.id,
      metadata: JSON.stringify({ name: client.name }),
      userId: session.user.id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/clients")
  revalidatePath(`/clients/${id}`)
  return client
}

export async function deleteClient(id: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  await prisma.client.delete({
    where: {
      id,
      orgId: session.user.orgId,
    },
  })

  revalidatePath("/clients")
}

export async function addNote(clientId: string, content: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      orgId: session.user.orgId,
    },
  })

  if (!client) {
    throw new Error("Client not found")
  }

  const note = await prisma.note.create({
    data: {
      content,
      clientId,
    },
  })

  revalidatePath(`/clients/${clientId}`)
  return note
}

export async function deleteNote(noteId: string) {
  const session = await auth()
  if (!session?.user?.orgId) {
    throw new Error("Unauthorized")
  }

  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      client: {
        orgId: session.user.orgId,
      },
    },
  })

  if (!note) {
    throw new Error("Note not found")
  }

  await prisma.note.delete({
    where: { id: noteId },
  })

  revalidatePath(`/clients/${note.clientId}`)
}
