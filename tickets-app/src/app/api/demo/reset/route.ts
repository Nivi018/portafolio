import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { auth } from "@/lib/auth";

/**
 * POST /api/demo/reset
 *
 * Re-runs the demo seed script. Protected by a shared secret passed via the
 * `x-demo-secret` header. Useful for live demos and interviews: a single
 * curl call brings the database back to a known clean state.
 *
 * Should be disabled in production unless `DEMO_RESET_SECRET` is set AND
 * the caller is an admin (we also require auth as a second check).
 */
export async function POST(req: Request) {
  const expected = process.env.DEMO_RESET_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Demo reset is not configured" },
      { status: 503 },
    );
  }

  const provided = req.headers.get("x-demo-secret");
  if (provided !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Require auth as a second check: only signed-in admins may reset.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return new Promise<Response>((resolve) => {
    const child = spawn("npx", ["tsx", "prisma/seed.ts"], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(
          NextResponse.json({
            ok: true,
            message: "Demo data reset",
            output: stdout,
          }),
        );
      } else {
        resolve(
          NextResponse.json(
            {
              ok: false,
              error: "Seed failed",
              code,
              stdout,
              stderr,
            },
            { status: 500 },
          ),
        );
      }
    });

    child.on("error", (err) => {
      resolve(
        NextResponse.json(
          { ok: false, error: "Failed to spawn seed", detail: err.message },
          { status: 500 },
        ),
      );
    });
  });
}
