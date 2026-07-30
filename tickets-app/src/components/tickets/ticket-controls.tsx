"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Priority, Role, Status } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateTicketStatus,
  updateTicketPriority,
  updateTicketAssignee,
  type UpdateTicketState,
} from "@/actions/tickets";
import { canTransition, requiresReason } from "@/lib/ticket-workflow";

type AgentOption = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  orgSlug: string;
  ticketId: string;
  currentStatus: Status;
  currentPriority: Priority;
  currentAssigneeId: string | null;
  role: Role;
  agents: AgentOption[];
};

const NONE = "__none__";

export function TicketControls({
  orgSlug,
  ticketId,
  currentStatus,
  currentPriority,
  currentAssigneeId,
  role,
  agents,
}: Props) {
  const t = useTranslations("Tickets.controls");
  const [pending, startTransition] = useTransition();

  const allowedTransitions = (Object.values(Status) as Status[]).filter((s) =>
    canTransition(currentStatus, s),
  );
  const canEdit = role === Role.AGENT || role === Role.ADMIN;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatusControl
        orgSlug={orgSlug}
        ticketId={ticketId}
        currentStatus={currentStatus}
        allowed={allowedTransitions}
        canEdit={canEdit || currentStatus === Status.OPEN}
        t={t}
        pending={pending}
        startTransition={startTransition}
      />

      {canEdit ? (
        <PriorityControl
          orgSlug={orgSlug}
          ticketId={ticketId}
          currentPriority={currentPriority}
          t={t}
          pending={pending}
          startTransition={startTransition}
        />
      ) : null}

      {canEdit ? (
        <AssigneeControl
          orgSlug={orgSlug}
          ticketId={ticketId}
          currentAssigneeId={currentAssigneeId}
          agents={agents}
          t={t}
          pending={pending}
          startTransition={startTransition}
        />
      ) : null}
    </div>
  );
}

type ControlProps = {
  orgSlug: string;
  ticketId: string;
  t: ReturnType<typeof useTranslations>;
  pending: boolean;
  startTransition: (cb: () => void) => void;
};

type StatusControlProps = ControlProps & {
  currentStatus: Status;
  allowed: Status[];
  canEdit: boolean;
};

function StatusControl({
  orgSlug,
  ticketId,
  currentStatus,
  allowed,
  canEdit,
  t,
}: StatusControlProps) {
  const [target, setTarget] = useState<Status | "">("");
  const [reason, setReason] = useState("");
  const [state, action, isPending] = useActionState<
    UpdateTicketState,
    FormData
  >(updateTicketStatus.bind(null, orgSlug, ticketId), {});

  const successKey = state.error ? `err:${state.error}` : "ok";

  if (!canEdit || allowed.length === 0) {
    return (
      <div className="rounded-lg border p-3">
        <p className="text-muted-foreground text-xs">{t("statusLabel")}</p>
        <p className="text-sm font-medium">{t(`statuses.${currentStatus}`)}</p>
      </div>
    );
  }

  return (
    <form
      key={successKey}
      action={action}
      className="space-y-2 rounded-lg border p-3"
    >
      <p className="text-muted-foreground text-xs">{t("statusLabel")}</p>
      <div className="flex gap-2">
        <input type="hidden" name="status" value={target} />
        <Select value={target} onValueChange={(v) => setTarget(v as Status)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t("changeStatus")} />
          </SelectTrigger>
          <SelectContent>
            {allowed.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`statuses.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={!target || isPending}>
          {t("apply")}
        </Button>
      </div>
      {target && requiresReason(currentStatus, target as Status) ? (
        <Textarea
          name="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("reopenReason")}
          rows={2}
          required
        />
      ) : null}
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
    </form>
  );
}

type PriorityControlProps = Omit<ControlProps, "pending"> & {
  currentPriority: Priority;
  pending: boolean;
};

function PriorityControl({
  orgSlug,
  ticketId,
  currentPriority,
  t,
}: PriorityControlProps) {
  const [target, setTarget] = useState<Priority | "">("");
  const [state, action, isPending] = useActionState<
    UpdateTicketState,
    FormData
  >(updateTicketPriority.bind(null, orgSlug, ticketId), {});

  const successKey = state.error ? `err:${state.error}` : "ok";

  return (
    <form
      key={successKey}
      action={action}
      className="space-y-2 rounded-lg border p-3"
    >
      <p className="text-muted-foreground text-xs">{t("priorityLabel")}</p>
      <div className="flex gap-2">
        <input type="hidden" name="priority" value={target} />
        <Select value={target} onValueChange={(v) => setTarget(v as Priority)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t(`priorities.${currentPriority}`)} />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Priority).map((p) => (
              <SelectItem key={p} value={p}>
                {t(`priorities.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={!target || isPending}>
          {t("apply")}
        </Button>
      </div>
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
    </form>
  );
}

type AssigneeControlProps = Omit<ControlProps, "pending"> & {
  currentAssigneeId: string | null;
  agents: AgentOption[];
  pending: boolean;
};

function AssigneeControl({
  orgSlug,
  ticketId,
  currentAssigneeId,
  agents,
  t,
}: AssigneeControlProps) {
  const [target, setTarget] = useState<string>(currentAssigneeId ?? NONE);
  const [state, action, isPending] = useActionState<
    UpdateTicketState,
    FormData
  >(updateTicketAssignee.bind(null, orgSlug, ticketId), {});

  const successKey = state.error
    ? `err:${state.error}`
    : `ok:${currentAssigneeId ?? NONE}`;

  return (
    <form
      key={successKey}
      action={action}
      className="space-y-2 rounded-lg border p-3"
    >
      <p className="text-muted-foreground text-xs">{t("assigneeLabel")}</p>
      <div className="flex gap-2">
        <input
          type="hidden"
          name="assigneeId"
          value={target === NONE ? "" : target}
        />
        <Select value={target} onValueChange={(v) => setTarget(v ?? NONE)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t("unassigned")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("unassigned")}</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name ?? a.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={isPending}>
          {t("apply")}
        </Button>
      </div>
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
    </form>
  );
}
