import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

const publicRoutes = ["/login", "/registro", "/recuperar-password"]
const apiAuthRoutes = ["/api/auth"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  const isApiAuthRoute = apiAuthRoutes.some((route) => pathname.startsWith(route))

  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
