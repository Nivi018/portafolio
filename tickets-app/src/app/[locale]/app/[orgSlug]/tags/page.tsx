import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/org-context";
import { can } from "@/lib/permissions";
import { TagsManager } from "@/components/settings/tags-manager";

export default async function TagsPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { org, membership } = await getActiveOrg(orgSlug);

  if (!can.manageOrg(membership.role)) {
    redirect(`/app/${orgSlug}/tickets`);
  }

  const t = await getTranslations("Tags");

  const tags = await db.tag.findMany({
    where: { orgId: org.id },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <TagsManager orgSlug={orgSlug} tags={tags} />
    </div>
  );
}
