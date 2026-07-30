import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPusherServer, isPusherConfigured } from "@/lib/pusher-server";

export async function POST(req: Request) {
  if (!isPusherConfigured()) {
    return NextResponse.json(
      { error: "Pusher not configured" },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const socketId = String(formData.get("socket_id") ?? "");
  const channel = String(formData.get("channel_name") ?? "");

  if (!socketId || !channel) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Authorize only private channels that the user is allowed to join.
  const userId = session.user.id;

  if (channel.startsWith("private-user-")) {
    const target = channel.slice("private-user-".length);
    if (target !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (channel.startsWith("private-org-")) {
    const orgId = channel.slice("private-org-".length);
    const membership = await db.membership.findFirst({
      where: { userId, orgId },
      select: { id: true },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const pusher = getPusherServer();
  if (!pusher) {
    return NextResponse.json(
      { error: "Pusher not configured" },
      { status: 503 },
    );
  }

  const authResponse = pusher.authorizeChannel(socketId, channel);
  return NextResponse.json(authResponse);
}
