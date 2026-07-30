"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

const NONE = "__none__";

const ACTION_KEYS = [
  "TICKET_CREATED",
  "TICKET_ASSIGNED",
  "TICKET_UNASSIGNED",
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "REPLY_ADDED",
  "INTERNAL_NOTE_ADDED",
  "TAG_ADDED",
  "TAG_REMOVED",
  "TICKET_REOPENED",
  "TICKET_RESOLVED",
  "TICKET_CLOSED",
  "MEMBER_INVITED",
  "MEMBER_JOINED",
  "MEMBER_REMOVED",
  "ROLE_CHANGED",
] as const;

type Actor = { id: string; name: string | null; email: string };

type Props = {
  actors: Actor[];
};

export function ActivityFilters({ actors }: Props) {
  const t = useTranslations("Activity");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const actorId = sp.get("actor") ?? "";
  const action = sp.get("action") ?? "";
  const days = sp.get("days") ?? "";

  const hasFilters = actorId || action || days;

  function update(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (!value || value === NONE) next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  function clear() {
    router.push(pathname);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1">
        <span className="text-muted-foreground text-xs">{t("actor")}</span>
        <Select
          value={actorId || NONE}
          onValueChange={(v) => update("actor", v ?? "")}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("anyActor")}</SelectItem>
            {actors.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name ?? a.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1">
        <span className="text-muted-foreground text-xs">{t("action")}</span>
        <Select
          value={action || NONE}
          onValueChange={(v) => update("action", v ?? "")}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("anyAction")}</SelectItem>
            {ACTION_KEYS.map((a) => (
              <SelectItem key={a} value={a}>
                {t(`actions.${a}` as `actions.${(typeof ACTION_KEYS)[number]}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1">
        <span className="text-muted-foreground text-xs">{t("range")}</span>
        <Select
          value={days || NONE}
          onValueChange={(v) => update("days", v ?? "")}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("anyTime")}</SelectItem>
            <SelectItem value="1">1d</SelectItem>
            <SelectItem value="7">7d</SelectItem>
            <SelectItem value="30">30d</SelectItem>
            <SelectItem value="90">90d</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clear}
          className="text-muted-foreground"
        >
          <X className="size-3" />
          {t("clear")}
        </Button>
      ) : null}
    </div>
  );
}
