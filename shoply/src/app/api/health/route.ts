import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Lightweight DB ping
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 })
  }
}
