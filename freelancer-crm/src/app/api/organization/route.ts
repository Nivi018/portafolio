import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.orgId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    const organization = await prisma.organization.update({
      where: { id: session.user.orgId },
      data: { name },
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Update organization error:", error)
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    )
  }
}
