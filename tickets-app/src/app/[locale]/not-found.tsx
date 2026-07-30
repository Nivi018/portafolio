import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export default async function LocaleNotFound() {
  const t = await getTranslations("Errors.notFound");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-muted-foreground font-mono text-xs">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
        <div className="flex justify-center gap-2">
          <Link href="/" className={buttonVariants({ variant: "default" })}>
            {t("home")}
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    </main>
  );
}
