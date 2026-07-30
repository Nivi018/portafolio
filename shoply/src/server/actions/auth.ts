"use server"

import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { z } from "zod"
import { signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendWelcome } from "@/lib/email"
import { mergeGuestCartToUser } from "./guest-cart"
import type { Role } from "@/generated/prisma/enums"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long"),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type ActionResult = {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { ok: false, error: "An account with this email already exists" }
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "CLIENT" satisfies Role,
    },
  })

  // Send welcome email (won't fail the request if email fails)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  sendWelcome({ to: email, name, appUrl }).catch((err) => {
    console.error("Failed to send welcome email:", err)
  })

  // Auto sign in after registration
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Account created, but sign in failed. Please sign in manually." }
    }
    throw error
  }

  redirect("/")
}

export async function mergeCartOnLogin(userId: string) {
  // Find the guest cart cookie via the prisma cart table
  // Guest carts are identified by guestId being set. We merge the most recent
  // active guest cart into the user's cart.
  const guestCart = await prisma.cart.findFirst({
    where: { guestId: { not: null }, userId: null },
    orderBy: { updatedAt: "desc" },
    include: { items: true },
  })
  if (guestCart?.guestId) {
    await mergeGuestCartToUser(userId, guestCart.guestId)
  }
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password" }
    }
    throw error
  }

  redirect("/")
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}

export async function loginWithGoogleAction() {
  await signIn("google", { redirectTo: "/" })
}
