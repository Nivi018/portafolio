import { getTranslations } from "next-intl/server";

export default async function LocaleLoading() {
  const t = await getTranslations("Common");

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center"
    >
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span className="border-muted-foreground inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
        {t("loading")}
      </div>
    </div>
  );
}
