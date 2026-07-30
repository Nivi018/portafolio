"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inviteMember,
  changeMemberRole,
  removeMember,
  type InviteMemberState,
} from "@/actions/members";

export function InviteForm({ orgSlug }: { orgSlug: string }) {
  const t = useTranslations("Members");
  const [state, action, pending] = useActionState<InviteMemberState, FormData>(
    inviteMember.bind(null, orgSlug),
    {},
  );
  const [role, setRole] = useState<Role>(Role.AGENT);

  return (
    <form
      key={state.success ? "ok" : state.error ? "err" : "init"}
      action={action}
      className="space-y-3 rounded-lg border p-4"
    >
      <h3 className="font-medium">{t("inviteTitle")}</h3>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1">
          <Input
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            required
          />
          {state.fieldErrors?.email ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.email}
            </p>
          ) : null}
        </div>
        <Select
          value={role}
          onValueChange={(v) => setRole((v ?? Role.AGENT) as Role)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Role.ADMIN}>{t("roles.ADMIN")}</SelectItem>
            <SelectItem value={Role.AGENT}>{t("roles.AGENT")}</SelectItem>
            <SelectItem value={Role.CUSTOMER}>{t("roles.CUSTOMER")}</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="role" value={role} />
        <Button type="submit" disabled={pending}>
          {pending ? t("inviting") : t("invite")}
        </Button>
      </div>
      {state.error && !state.fieldErrors ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
      {state.success ? (
        <div className="bg-muted rounded-md p-3 text-xs">
          <p className="font-medium">{t("inviteCreated")}</p>
          <p className="text-muted-foreground mt-1 break-all">
            <a
              href={state.success.inviteUrl}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              {state.success.inviteUrl}
            </a>
          </p>
        </div>
      ) : null}
    </form>
  );
}

type Member = {
  id: string;
  role: Role;
  joinedAt: Date | null;
  user: { id: string; name: string | null; email: string };
};

export function MemberRow({
  orgSlug,
  member,
  currentUserId,
}: {
  orgSlug: string;
  member: Member;
  currentUserId: string;
}) {
  const t = useTranslations("Members");
  const isSelf = member.user.id === currentUserId;

  return (
    <tr className="border-t">
      <td className="px-4 py-3">
        <p className="text-sm font-medium">
          {member.user.name ?? member.user.email}
          {isSelf ? (
            <span className="text-muted-foreground ml-2 text-xs">
              ({t("you")})
            </span>
          ) : null}
        </p>
        <p className="text-muted-foreground text-xs">{member.user.email}</p>
      </td>
      <td className="px-4 py-3">
        {!isSelf ? (
          <form
            action={changeMemberRole.bind(null, orgSlug, member.id)}
            className="flex items-center gap-2"
          >
            <select
              name="role"
              defaultValue={member.role}
              className="bg-background rounded-md border px-2 py-1 text-xs"
            >
              <option value={Role.ADMIN}>{t("roles.ADMIN")}</option>
              <option value={Role.AGENT}>{t("roles.AGENT")}</option>
              <option value={Role.CUSTOMER}>{t("roles.CUSTOMER")}</option>
            </select>
            <Button type="submit" size="sm" variant="ghost">
              {t("apply")}
            </Button>
          </form>
        ) : (
          <span className="bg-secondary rounded-full px-2 py-0.5 text-xs">
            {t(`roles.${member.role}`)}
          </span>
        )}
      </td>
      <td className="text-muted-foreground px-4 py-3 text-sm">
        {member.joinedAt
          ? new Date(member.joinedAt).toLocaleDateString()
          : t("pending")}
      </td>
      <td className="px-4 py-3 text-right">
        {!isSelf ? (
          <form
            action={removeMember.bind(null, orgSlug, member.id, new FormData())}
          >
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="text-destructive"
            >
              {t("remove")}
            </Button>
          </form>
        ) : null}
      </td>
    </tr>
  );
}
