import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type CannedResponseListItem = {
  id: string;
  title: string;
  body: string;
};

const SELECT = {
  id: true,
  title: true,
  body: true,
} satisfies Prisma.CannedResponseSelect;

export async function listActiveCannedResponses(
  orgId: string,
): Promise<CannedResponseListItem[]> {
  return db.cannedResponse.findMany({
    where: { orgId },
    orderBy: { createdAt: "asc" },
    select: SELECT,
  });
}
