import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default async function AppNotFound() {
  const t = await getTranslations("Errors.notFound");

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-muted-foreground font-mono text-xs">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
