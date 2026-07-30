"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteWebhook, toggleWebhook } from "@/actions/webhooks";

type WebhookRow = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastCalledAt: string;
  lastError: string | null;
};

type Props = {
  orgSlug: string;
  webhooks: WebhookRow[];
};

export function WebhookList({ orgSlug, webhooks }: Props) {
  const t = useTranslations("Webhooks");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteWebhook(orgSlug, id, new FormData());
      router.refresh();
    });
  }

  function onToggle(id: string) {
    startTransition(async () => {
      await toggleWebhook(orgSlug, id, new FormData());
      router.refresh();
    });
  }

  if (webhooks.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("empty")}</p>;
  }

  return (
    <ul className="space-y-2">
      {webhooks.map((w) => (
        <li
          key={w.id}
          className="bg-card flex items-center justify-between rounded-md border p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{w.url}</p>
            <p className="text-muted-foreground text-xs">
              {w.events.join(", ")} · {t("lastCall", { when: w.lastCalledAt })}
            </p>
            {w.lastError ? (
              <p className="text-destructive text-xs">{w.lastError}</p>
            ) : null}
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggle(w.id)}
              disabled={pending}
              title={w.active ? t("disable") : t("enable")}
            >
              <Power
                className={`size-3 ${w.active ? "text-success" : "text-muted-foreground"}`}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onDelete(w.id)}
              disabled={pending}
              className="text-destructive"
              title={t("delete")}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
