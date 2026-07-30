import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { forgotPasswordSchema } from "@/lib/validators"
import { nanoid } from "nanoid"
import { sendEmail, getPasswordResetEmailTemplate, appUrl } from "@/lib/email"

interface ZodError {
  name: string
  errors: { message: string }[]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = forgotPasswordSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      // Return success even if user doesn't exist for security
      return NextResponse.json({ message: "If an account exists, a reset link has been sent" })
    }

    // Generate reset token
    const token = nanoid(64)
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    // Store reset token
    await prisma.passwordResetToken.create({
      data: {
        email: validatedData.email,
        token,
        expires,
      },
    })

    // Send reset email
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    const html = getPasswordResetEmailTemplate({
      userName: user.name || "User",
      resetUrl,
    })

    await sendEmail({
      to: validatedData.email,
      subject: "Reset your FreelancerCRM password",
      html,
    })

    return NextResponse.json({ message: "If an account exists, a reset link has been sent" })
  } catch (error) {
    console.error("Forgot password error:", error)

    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as unknown as ZodError
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
