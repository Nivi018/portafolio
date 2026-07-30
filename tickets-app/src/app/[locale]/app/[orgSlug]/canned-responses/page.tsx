import { setRequestLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/org-context";
import { CannedResponsesManager } from "@/components/settings/canned-responses-manager";

export default async function CannedResponsesPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { org, membership } = await getActiveOrg(orgSlug);

  if (membership.role === Role.CUSTOMER) {
    redirect(`/app/${orgSlug}/tickets`);
  }

  const t = await getTranslations("CannedResponses");

  const items = await db.cannedResponse.findMany({
    where: { orgId: org.id },
    select: { id: true, title: true, body: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <CannedResponsesManager orgSlug={orgSlug} items={items} />
    </div>
  );
}
