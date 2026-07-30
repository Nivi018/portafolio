"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/enums"

export async function updateUserRoleAction(id: string, role: Role) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  if (id === session.user.id && role !== "ADMIN") {
    return { ok: false, error: "You cannot demote yourself" }
  }

  await prisma.user.update({ where: { id }, data: { role } })
  revalidatePath("/admin/users")
  return { ok: true }
}
