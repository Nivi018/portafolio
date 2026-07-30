import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Test-only endpoint: mint a valid NextAuth session cookie for a known
 * demo user. Only available in development or when E2E_AUTH_BYPASS=1.
 *
 * Usage: POST /api/test/auth { "email": "admin@acme.test" }
 * Returns: { "cookieName": "authjs.session-token", "cookieValue": "..." }
 */
export async function POST(req: Request) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.E2E_AUTH_BYPASS !== "1"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = (await req.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // We use the underlying Auth.js session-creation directly via the
  // adapter, then encode a JWT for the cookie.
  const { encode } = await import("next-auth/jwt");
  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
    },
    secret: process.env.AUTH_SECRET ?? "",
    salt: "authjs.session-token",
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    cookieName: "authjs.session-token",
    cookieValue: token,
  });
}
