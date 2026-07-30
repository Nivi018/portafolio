import { db } from "@/lib/db";

export async function listMentionableUsers(
  orgId: string,
  excludeUserId: string,
  query: string,
) {
  const q = query.toLowerCase().replace(/^@/, "");
  if (!q) return [];

  return db.user.findMany({
    where: {
      memberships: { some: { orgId } },
      id: { not: excludeUserId },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 5,
  });
}

export async function findUsersByUsernames(orgId: string, usernames: string[]) {
  if (usernames.length === 0) return [];

  // Build per-username conditions: match by exact email OR by name
  // (or by "firstname.lastname" form of the name).
  const orClauses = usernames.flatMap((u) => {
    const lc = u.toLowerCase();
    const dotName = u.includes(".")
      ? u
          .split(".")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : null;
    return [
      { email: { equals: lc, mode: "insensitive" as const } },
      { name: { equals: lc, mode: "insensitive" as const } },
      ...(dotName
        ? [{ name: { equals: dotName, mode: "insensitive" as const } }]
        : []),
    ];
  });

  return db.user.findMany({
    where: {
      memberships: { some: { orgId } },
      OR: orClauses,
    },
    select: { id: true, name: true, email: true },
  });
}
