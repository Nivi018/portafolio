"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { usePusherChannel } from "@/hooks/use-pusher-channel";

type Props = {
  orgId: string;
  currentUserId: string;
};

type TicketCreated = { ticketId: string; subject: string };
type TicketAssigned = { ticketId: string };

export function TicketListRealtimeListener({ orgId, currentUserId }: Props) {
  const router = useRouter();
  const t = useTranslations("Realtime");

  usePusherChannel<TicketCreated>(
    `private-org-${orgId}`,
    "ticket:created",
    (data) => {
      toast.message(t("newTicket"), { description: data.subject });
      router.refresh();
    },
  );

  usePusherChannel<{ ticketId: string; changes: Record<string, unknown> }>(
    `private-org-${orgId}`,
    "ticket:updated",
    () => {
      router.refresh();
    },
  );

  usePusherChannel<TicketAssigned>(
    `private-user-${currentUserId}`,
    "ticket:assigned",
    () => {
      toast.success(t("assignedToYou"));
      router.refresh();
    },
  );

  return null;
}
