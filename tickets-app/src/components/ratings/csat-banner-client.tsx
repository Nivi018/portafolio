"use client";

import { useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { dismissCsatBanner } from "@/actions/csat";

type Props = {
  subject: string;
  ticketId: string;
  orgSlug: string;
  extra: number;
};

export function CsatBannerClient({ subject, ticketId, orgSlug, extra }: Props) {
  const t = useTranslations("Csat");
  const [pending, startTransition] = useTransition();

  function dismiss() {
    startTransition(async () => {
      await dismissCsatBanner();
      // Hide the banner client-side; refresh to re-render without it.
      const el = document.getElementById("csat-banner");
      if (el) el.style.display = "none";
    });
  }

  return (
    <div
      id="csat-banner"
      role="status"
      className="flex items-center justify-between gap-3 border-b border-yellow-300 bg-yellow-50 px-6 py-2.5 text-sm dark:border-yellow-900 dark:bg-yellow-950/30"
    >
      <div className="flex items-center gap-2">
        <Star className="size-4 fill-yellow-500 text-yellow-500" />
        <span>
          <span className="font-medium">{t("prompt")}</span>{" "}
          <span className="text-muted-foreground">
            {t("subjectLabel", { subject })}
          </span>
        </span>
        {extra > 0 ? (
          <span className="text-muted-foreground ml-1 text-xs">
            {t("more", { count: extra })}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={`/app/${orgSlug}/tickets/${ticketId}`}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          {t("rate")}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          disabled={pending}
          aria-label={t("dismiss")}
          className="text-muted-foreground hover:text-foreground p-1"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
