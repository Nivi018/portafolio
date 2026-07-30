import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inviteSchema } from "@/lib/validators"
import { nanoid } from "nanoid"
import { sendEmail, getInvitationEmailTemplate, appUrl } from "@/lib/email"

interface ZodError {
  name: string
  errors: { message: string }[]
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.orgId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = inviteSchema.parse(body)

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.orgId },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      // If user exists, add to organization
      if (existingUser.orgId === session.user.orgId) {
        return NextResponse.json(
          { error: "User is already a member" },
          { status: 400 }
        )
      }

      // Update user's org
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { orgId: session.user.orgId, role: validatedData.role as "ADMIN" | "MEMBER" },
      })

      return NextResponse.json({ message: "User added to organization" })
    }

    // Generate invitation token
    const token = nanoid(32)

    // Send invitation email
    const inviteUrl = `${appUrl}/registro?invite=${token}&email=${encodeURIComponent(validatedData.email)}&org=${organization.slug}`

    const html = getInvitationEmailTemplate({
      inviterName: session.user.name || "Someone",
      organizationName: organization.name,
      inviteUrl,
    })

    const result = await sendEmail({
      to: validatedData.email,
      subject: `You're invited to join ${organization.name} on FreelancerCRM`,
      html,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send invitation email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Invitation sent successfully" })
  } catch (error) {
    console.error("Invite error:", error)

    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as unknown as ZodError
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    )
  }
}
