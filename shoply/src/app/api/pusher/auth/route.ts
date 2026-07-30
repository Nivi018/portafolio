import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // For now just accept; Pusher private channels would go here
  return NextResponse.json({ ok: true })
}
