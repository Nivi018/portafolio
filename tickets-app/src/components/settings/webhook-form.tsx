"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWebhook, type WebhookState } from "@/actions/webhooks";

const initial: WebhookState = {};

type Props = {
  orgSlug: string;
  events: readonly string[];
};

export function WebhookForm({ orgSlug, events }: Props) {
  const t = useTranslations("Webhooks");
  const [state, action, pending] = useActionState<WebhookState, FormData>(
    createWebhook.bind(null, orgSlug),
    initial,
  );

  return (
    <form
      key={state.success ? "ok" : state.error ? "err" : "init"}
      action={action}
      className="space-y-3 rounded-lg border p-4"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium">{t("url")}</label>
        <Input
          name="url"
          type="url"
          placeholder="https://example.com/webhooks/tickets"
          required
        />
        {state.fieldErrors?.url ? (
          <p className="text-destructive text-xs">{state.fieldErrors.url}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">{t("events")}</span>
        <div className="grid grid-cols-2 gap-2">
          {events.map((e) => (
            <label
              key={e}
              className="hover:bg-muted flex items-center gap-2 rounded px-2 py-1 text-sm"
            >
              <input
                type="checkbox"
                name="events"
                value={e}
                className="size-4"
              />
              <code className="text-xs">{e}</code>
            </label>
          ))}
        </div>
        {state.fieldErrors?.events ? (
          <p className="text-destructive text-xs">{state.fieldErrors.events}</p>
        ) : null}
      </div>

      {state.error && !state.fieldErrors ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-success text-sm">{t("created")}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
