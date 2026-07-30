"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  updateNotificationPrefs,
  type NotificationPrefsState,
} from "@/actions/notification-prefs";

const initial: NotificationPrefsState = {};

type Prefs = {
  notifyEmailReplies: boolean;
  notifyEmailMentions: boolean;
  notifyEmailStatus: boolean;
  notifyEmailCsat: boolean;
  notifyEmailAssign: boolean;
};

type Props = { defaults: Prefs };

export function NotificationPrefsForm({ defaults }: Props) {
  const t = useTranslations("NotificationPrefs");
  const [state, action, pending] = useActionState<
    NotificationPrefsState,
    FormData
  >(updateNotificationPrefs, initial);

  return (
    <form
      key={state.success ? "ok" : state.error ? "err" : "init"}
      action={action}
      className="space-y-4 rounded-lg border p-4"
    >
      <div className="space-y-3">
        <PrefRow
          name="notifyEmailReplies"
          label={t("replies")}
          description={t("repliesHint")}
          defaultChecked={defaults.notifyEmailReplies}
        />
        <PrefRow
          name="notifyEmailMentions"
          label={t("mentions")}
          description={t("mentionsHint")}
          defaultChecked={defaults.notifyEmailMentions}
        />
        <PrefRow
          name="notifyEmailStatus"
          label={t("status")}
          description={t("statusHint")}
          defaultChecked={defaults.notifyEmailStatus}
        />
        <PrefRow
          name="notifyEmailCsat"
          label={t("csat")}
          description={t("csatHint")}
          defaultChecked={defaults.notifyEmailCsat}
        />
        <PrefRow
          name="notifyEmailAssign"
          label={t("assign")}
          description={t("assignHint")}
          defaultChecked={defaults.notifyEmailAssign}
        />
      </div>

      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t("saved")}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

function PrefRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="hover:bg-muted/40 flex items-start justify-between gap-4 rounded-md p-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4"
      />
    </label>
  );
}
