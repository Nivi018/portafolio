"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Undo2, Trash2 } from "lucide-react";
import { restoreTicket, purgeTicket } from "@/actions/trash";

type TrashItemLike = {
  id: string;
  subject: string;
  customer: { name: string | null; email: string };
};

type Props = {
  orgSlug: string;
  item: TrashItemLike;
  formattedDeletedAt: string;
};

export function TrashRow({ orgSlug, item, formattedDeletedAt }: Props) {
  const t = useTranslations("Trash");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onRestore() {
    startTransition(async () => {
      const res = await restoreTicket(orgSlug, item.id, new FormData());
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  function onPurge() {
    if (!confirm(t("confirmPurge"))) return;
    startTransition(async () => {
      const res = await purgeTicket(orgSlug, item.id, new FormData());
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-3">
        <p className="font-medium">{item.subject}</p>
      </td>
      <td className="text-muted-foreground px-4 py-3 text-sm">
        {item.customer.name ?? item.customer.email}
      </td>
      <td className="text-muted-foreground px-4 py-3 text-sm">
        {formattedDeletedAt}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRestore}
            disabled={pending}
            title={t("restore")}
          >
            <Undo2 className="size-3" />
            {t("restore")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onPurge}
            disabled={pending}
            className="text-destructive"
            title={t("purge")}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
