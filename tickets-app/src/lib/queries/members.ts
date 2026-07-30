import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export async function listOrgAgents(orgId: string) {
  return db.membership.findMany({
    where: { orgId, role: { in: [Role.AGENT, Role.ADMIN] } },
    select: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
}
