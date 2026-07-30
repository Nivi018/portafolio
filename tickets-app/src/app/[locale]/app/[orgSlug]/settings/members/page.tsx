import { setRequestLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/org-context";
import { can } from "@/lib/permissions";
import { InviteForm, MemberRow } from "@/components/settings/member-row";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { user, org, membership } = await getActiveOrg(orgSlug);

  const t = await getTranslations("Members");

  const members = await db.membership.findMany({
    where: { orgId: org.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { invitedAt: "asc" },
  });

  const isAdmin = can.manageOrg(membership.role);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {isAdmin ? <InviteForm orgSlug={orgSlug} /> : null}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.member")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.role")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.joined")}
              </th>
              <th className="px-4 py-2 text-right font-medium">
                {t("columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow
                key={m.id}
                orgSlug={orgSlug}
                member={{
                  id: m.id,
                  role: m.role,
                  joinedAt: m.joinedAt,
                  user: m.user,
                }}
                currentUserId={user.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!isAdmin ? (
        <p className="text-muted-foreground text-sm">{t("adminOnly")}</p>
      ) : null}

      <div>
        <p className="text-muted-foreground text-sm">
          {t("legend", {
            count: members.filter((m) => m.role === Role.ADMIN).length,
          })}
        </p>
      </div>
    </div>
  );
}
