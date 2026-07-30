"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { acceptInvite, type AcceptInviteState } from "@/actions/members";

const initial: AcceptInviteState = {};

export function JoinButton({ token }: { token: string }) {
  const t = useTranslations("Join");
  const router = useRouter();
  const [state, action, pending] = useActionState<AcceptInviteState, FormData>(
    acceptInvite,
    initial,
  );

  useEffect(() => {
    if (state.orgSlug) {
      router.push(`/app/${state.orgSlug}`);
    }
  }, [state.orgSlug, router]);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("joining") : t("join")}
      </Button>
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
    </form>
  );
}
