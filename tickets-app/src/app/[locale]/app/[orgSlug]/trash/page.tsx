import { setRequestLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getActiveOrg } from "@/lib/org-context";
import { listTrash } from "@/lib/queries/trash";
import { TrashRow } from "@/components/settings/trash-row";

function formatDate(date: Date | null, locale: string) {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function TrashPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { org, membership } = await getActiveOrg(orgSlug);

  if (membership.role !== Role.ADMIN) {
    redirect(`/app/${orgSlug}/tickets`);
  }

  const t = await getTranslations("Trash");

  const items = await listTrash(org.id);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.subject")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.customer")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.deletedAt")}
              </th>
              <th className="px-4 py-2 text-right font-medium">
                {t("columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <TrashRow
                  key={t.id}
                  orgSlug={orgSlug}
                  item={t}
                  formattedDeletedAt={formatDate(t.deletedAt, locale)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
