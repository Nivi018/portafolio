import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { type NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/enums"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = ((user as { role?: Role }).role ?? "CLIENT") as Role
      }

      // Fetch latest role on update
      if (trigger === "update" && session?.user) {
        token.name = session.user.name
      }

      if (token.id && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        if (dbUser) token.role = dbUser.role as Role
      }

      return token
    },

    async signIn({ user }) {
      // Merge guest cart on sign in
      if (user?.id) {
        try {
          const { mergeCartOnLogin } = await import("@/server/actions/auth")
          const { cookies } = await import("next/headers")
          const guestId = (await cookies()).get("shoply_guest_cart")?.value
          if (guestId) {
            const { mergeGuestCartToUser } = await import("@/server/actions/guest-cart")
            await mergeGuestCartToUser(user.id, guestId)
          }
        } catch {
          // Don't fail login on cart merge errors
        }
      }
      return true
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as Role) ?? "CLIENT"
      }
      return session
    },
      authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl

      // Admin routes
      if (pathname.startsWith("/admin")) {
        return isLoggedIn && auth?.user?.role === "ADMIN"
      }

      // Account routes (auth required)
      if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
        return isLoggedIn
      }

      // Wishlist, cart, and account require login
      if (pathname.startsWith("/wishlist")) {
        return isLoggedIn
      }

      return true
    },
  },
} satisfies NextAuthConfig
