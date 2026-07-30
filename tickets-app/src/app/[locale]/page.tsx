import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");

  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        <div className="flex justify-center gap-2">
          <Button>{t("getStarted")}</Button>
          <Button variant="outline">{t("signIn")}</Button>
        </div>
        <div className="flex justify-center pt-4">
          <LocaleSwitcher />
        </div>
      </div>
    </main>
  );
}
