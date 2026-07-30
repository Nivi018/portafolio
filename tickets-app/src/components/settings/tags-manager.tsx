"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTag, deleteTag, type TagState } from "@/actions/tags";

type Tag = { id: string; name: string; color: string };

export function TagsManager({
  orgSlug,
  tags,
}: {
  orgSlug: string;
  tags: Tag[];
}) {
  const t = useTranslations("Tags");
  const [state, action, pending] = useActionState<TagState, FormData>(
    createTag.bind(null, orgSlug),
    {},
  );
  const [color, setColor] = useState("#6b7280");

  return (
    <div className="space-y-6">
      <form
        key={state.error ? "err" : "ok"}
        action={action}
        className="space-y-3 rounded-lg border p-4"
      >
        <h3 className="font-medium">{t("newTag")}</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Input name="name" placeholder={t("namePlaceholder")} required />
            {state.fieldErrors?.name ? (
              <p className="text-destructive text-xs">
                {state.fieldErrors.name}
              </p>
            ) : null}
          </div>
          <input type="hidden" name="color" value={color} />
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 cursor-pointer p-1"
          />
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
                {t("columns.name")}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("columns.color")}
              </th>
              <th className="px-4 py-2 text-right font-medium">
                {t("columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {tags.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.id} className="border-t">
                  <td className="px-4 py-3">{tag.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block h-4 w-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={deleteTag.bind(
                        null,
                        orgSlug,
                        tag.id,
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
