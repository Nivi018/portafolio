"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Priority, Status } from "@prisma/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

const ALL = "__all__";

type Props = {
  showMineToggle?: boolean;
};

export function TicketFilters({ showMineToggle = false }: Props) {
  const t = useTranslations("Tickets.filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") ?? "";
  const currentStatus = searchParams.get("status") ?? ALL;
  const currentPriority = searchParams.get("priority") ?? ALL;
  const mine = searchParams.get("mine") === "1";

  function buildHref(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === ALL) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete("cursor");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function applySearch(value: string) {
    startTransition(() => {
      router.replace(buildHref({ q: value || null }));
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form
        action={(fd) => {
          applySearch(String(fd.get("q") ?? ""));
        }}
        className="flex gap-2"
      >
        <Input
          key={currentQuery}
          name="q"
          defaultValue={currentQuery}
          placeholder={t("searchPlaceholder")}
          className="w-64"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {t("search")}
        </Button>
      </form>

      <div className="grid gap-1">
        <Select
          value={currentStatus}
          onValueChange={(v) => router.push(buildHref({ status: v }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("statusPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allStatuses")}</SelectItem>
            {Object.values(Status).map((s) => (
              <SelectItem key={s} value={s}>
                {t(`statuses.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1">
        <Select
          value={currentPriority}
          onValueChange={(v) => router.push(buildHref({ priority: v }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("priorityPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allPriorities")}</SelectItem>
            {Object.values(Priority).map((p) => (
              <SelectItem key={p} value={p}>
                {t(`priorities.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showMineToggle ? (
        <Link
          href={buildHref({ mine: mine ? null : "1" })}
          className="text-sm underline-offset-4 hover:underline"
        >
          {mine ? t("showAll") : t("showMine")}
        </Link>
      ) : null}
    </div>
  );
}
