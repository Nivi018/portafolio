"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createCannedResponse,
  deleteCannedResponse,
  type CannedResponseState,
} from "@/actions/canned-responses";

type Canned = { id: string; title: string; body: string };

export function CannedResponsesManager({
  orgSlug,
  items,
}: {
  orgSlug: string;
  items: Canned[];
}) {
  const t = useTranslations("CannedResponses");
  const [state, action, pending] = useActionState<
    CannedResponseState,
    FormData
  >(createCannedResponse.bind(null, orgSlug), {});

  return (
    <div className="space-y-6">
      <form
        key={state.error ? "err" : "ok"}
        action={action}
        className="space-y-3 rounded-lg border p-4"
      >
        <h3 className="font-medium">{t("newCanned")}</h3>
        <div className="space-y-1">
          <Input name="title" placeholder={t("titlePlaceholder")} required />
          {state.fieldErrors?.title ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.title}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Textarea
            name="body"
            placeholder={t("bodyPlaceholder")}
            rows={4}
            required
          />
          {state.fieldErrors?.body ? (
            <p className="text-destructive text-xs">{state.fieldErrors.body}</p>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {t("create")}
          </Button>
        </div>
        {state.error && !state.fieldErrors ? (
          <p className="text-destructive text-xs">{state.error}</p>
        ) : null}
      </form>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.title")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.body")}
              </th>
              <th className="px-4 py-2 text-right font-medium">
                {t("columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {item.body.length > 80
                      ? `${item.body.slice(0, 80)}…`
                      : item.body}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={deleteCannedResponse.bind(
                        null,
                        orgSlug,
                        item.id,
                        new FormData(),
                      )}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
