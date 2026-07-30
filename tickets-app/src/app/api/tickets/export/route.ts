import { NextResponse } from "next/server";
import { Status, Priority, Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const STATUSES = Object.values(Status);
const PRIORITIES = Object.values(Priority);

function parseStatus(value: string | null): Status | null {
  if (!value) return null;
  return (STATUSES as string[]).includes(value) ? (value as Status) : null;
}
function parsePriority(value: string | null): Priority | null {
  if (!value) return null;
  return (PRIORITIES as string[]).includes(value) ? (value as Priority) : null;
}
function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * GET /api/tickets/export?orgSlug=...&status=...&priority=...
 *
 * Returns a CSV file of the current org's tickets, filtered by the same
 * query params as /tickets. Customers only see their own tickets.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const orgSlug = url.searchParams.get("orgSlug");
  if (!orgSlug) {
    return NextResponse.json({ error: "orgSlug is required" }, { status: 400 });
  }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, org: { slug: orgSlug } },
    select: { orgId: true, role: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = parseStatus(url.searchParams.get("status"));
  const priority = parsePriority(url.searchParams.get("priority"));
  const q = url.searchParams.get("q");
  const mine = url.searchParams.get("mine") === "1";

  const where: Parameters<typeof db.ticket.findMany>[0] = { where: {} };
  where.where = {
    orgId: membership.orgId,
    deletedAt: null,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(q && { subject: { contains: q, mode: "insensitive" } }),
    ...(mine && { customerId: session.user.id }),
  };
  if (membership.role === Role.CUSTOMER) {
    where.where = { ...where.where, customerId: session.user.id };
  }

  const tickets = await db.ticket.findMany({
    where: where.where,
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      firstResponseAt: true,
      customer: { select: { name: true, email: true } },
      assignee: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000, // Safety cap
  });

  const header = [
    "id",
    "subject",
    "status",
    "priority",
    "customer",
    "customer_email",
    "assignee",
    "assignee_email",
    "created_at",
    "updated_at",
    "first_response_at",
    "resolved_at",
  ];
  const rows = tickets.map((t) =>
    [
      t.id,
      t.subject,
      t.status,
      t.priority,
      t.customer.name ?? "",
      t.customer.email,
      t.assignee?.name ?? "",
      t.assignee?.email ?? "",
      t.createdAt.toISOString(),
      t.updatedAt.toISOString(),
      t.firstResponseAt?.toISOString() ?? "",
      t.resolvedAt?.toISOString() ?? "",
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  const filename = `tickets-${orgSlug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
