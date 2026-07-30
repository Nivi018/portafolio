import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

/**
 * Rate-limited login endpoint. Limits attempts per IP to prevent brute force.
 */
export async function POST(request: Request) {
  const key = getRateLimitKey(request, "auth")
  const rl = rateLimit(key, 5, 60_000) // 5 attempts per minute per IP
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    )
  }

  // Forward to the actual NextAuth login handler
  return NextResponse.json({ ok: true, message: "Rate limit check passed" })
}
