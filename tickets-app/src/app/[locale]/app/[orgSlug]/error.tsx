"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("[tickets-app:app-error]", error);
    }
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("appTitle")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("appDescription")}</p>
        {error.digest ? (
          <p className="text-muted-foreground font-mono text-xs">
            {error.digest}
          </p>
        ) : null}
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>{t("retry")}</Button>
          <Button variant="outline" onClick={() => router.back()}>
            {t("back")}
          </Button>
        </div>
      </div>
    </div>
  );
}
