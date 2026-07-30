import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validators"
import { generateSlug } from "@/lib/utils"

interface ZodError {
  name: string
  errors: { message: string }[]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    const orgSlug = generateSlug(validatedData.organizationName)

    const existingOrg = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    })

    const finalSlug = existingOrg ? `${orgSlug}-${Date.now()}` : orgSlug

    const organization = await prisma.organization.create({
      data: {
        name: validatedData.organizationName,
        slug: finalSlug,
      },
    })

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword,
        role: "OWNER",
        orgId: organization.id,
      },
    })

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)

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
