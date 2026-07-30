"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteOwnAccount } from "@/actions/profile";

export function DeleteAccountSection() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function onDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteOwnAccount();
      if (result.error) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      router.push("/");
    });
  }

  return (
    <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-4">
      <h3 className="font-medium">{t("deleteTitle")}</h3>
      <p className="text-muted-foreground text-sm">{t("deleteDescription")}</p>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {confirming ? (
        <p className="text-destructive text-sm font-medium">
          {t("deleteConfirm")}
        </p>
      ) : null}
      <div className="flex gap-2">
        {confirming ? (
          <>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={pending}
            >
              {pending ? t("deleting") : t("deleteNow")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={pending}
          >
            {t("deleteAccount")}
          </Button>
        )}
      </div>
    </div>
  );
}
