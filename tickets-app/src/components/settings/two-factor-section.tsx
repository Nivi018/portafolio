"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldOff } from "lucide-react";
import {
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  type TwoFactorState,
} from "@/actions/two-factor";

const initial: TwoFactorState = {};

type Props = {
  enabled: boolean;
};

export function TwoFactorSection({ enabled }: Props) {
  const t = useTranslations("TwoFactor");
  const [mode, setMode] = useState<"view" | "setup" | "disable">("view");
  const [pending, startTransition] = useTransition();
  const [setupData, setSetupData] = useState<TwoFactorState>({});
  const [disableState, disableAction, disablePending] = useActionState<
    TwoFactorState,
    FormData
  >(disableTwoFactor, initial);
  const [confirmState, confirmAction, confirmPending] = useActionState<
    TwoFactorState,
    FormData
  >(confirmTwoFactorSetup, initial);

  function startSetup() {
    startTransition(async () => {
      const res = await startTwoFactorSetup();
      setSetupData(res);
      if (!res.error) setMode("setup");
    });
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-medium">{t("title")}</h3>
      {enabled ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <ShieldCheck className="text-success size-4" />
          {t("enabledDescription")}
        </p>
      ) : (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <ShieldOff className="size-4" />
          {t("disabledDescription")}
        </p>
      )}

      {mode === "view" && !enabled ? (
        <Button onClick={startSetup} disabled={pending}>
          {t("enable")}
        </Button>
      ) : null}

      {mode === "view" && enabled ? (
        <form action={disableAction} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">
              {t("disableCodeLabel")}
            </label>
            <Input
              name="code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              required
            />
          </div>
          <Button type="submit" variant="destructive" disabled={disablePending}>
            {disablePending ? t("disabling") : t("disable")}
          </Button>
        </form>
      ) : null}

      {mode === "setup" ? (
        <div className="space-y-3">
          <p className="text-sm">{t("scanQR")}</p>
          {setupData.qrCode ? (
            <div className="bg-muted inline-block rounded-md p-3">
              <Image
                src={setupData.qrCode}
                alt={t("qrAlt")}
                width={240}
                height={240}
                unoptimized
              />
            </div>
          ) : null}
          {setupData.secret ? (
            <p className="text-muted-foreground text-xs">
              {t("manualCode", { code: setupData.secret })}
            </p>
          ) : null}
          <form action={confirmAction} className="flex items-end gap-2">
            <input type="hidden" name="secret" value={setupData.secret} />
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">
                {t("confirmCodeLabel")}
              </label>
              <Input
                name="code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                required
                autoComplete="one-time-code"
              />
            </div>
            <Button type="submit" disabled={confirmPending}>
              {confirmPending ? t("verifying") : t("verify")}
            </Button>
          </form>
          {confirmState.error ? (
            <p className="text-destructive text-sm">{confirmState.error}</p>
          ) : null}
          {confirmState.success ? (
            <p className="text-success text-sm">{t("enabled")}</p>
          ) : null}
        </div>
      ) : null}

      {disableState.error ? (
        <p className="text-destructive text-sm">{disableState.error}</p>
      ) : null}
      {disableState.success ? (
        <p className="text-success text-sm">{t("disabled")}</p>
      ) : null}
    </div>
  );
}
