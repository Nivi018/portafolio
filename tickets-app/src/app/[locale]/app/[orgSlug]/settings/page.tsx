import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getActiveOrg } from "@/lib/org-context";
import { can } from "@/lib/permissions";
import { OrgSettingsForm } from "@/components/settings/org-settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { org, membership } = await getActiveOrg(orgSlug);

  if (!can.manageOrg(membership.role)) {
    redirect(`/app/${orgSlug}/settings/members`);
  }

  const t = await getTranslations("Settings");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <OrgSettingsForm
        orgSlug={orgSlug}
        defaults={{
          name: org.name,
          slug: org.slug,
          primaryColor: org.primaryColor,
          logo: org.logo,
        }}
      />
    </div>
  );
}
