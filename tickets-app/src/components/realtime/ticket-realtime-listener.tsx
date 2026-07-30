"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { usePusherChannel } from "@/hooks/use-pusher-channel";

type Props = {
  orgId: string;
  ticketId: string;
  currentUserId: string;
};

type ReplyCreated = {
  ticketId: string;
  reply: { authorId: string; authorName: string | null; isInternal: boolean };
};

type TicketUpdated = {
  ticketId: string;
  changes: Record<string, unknown>;
};

export function TicketRealtimeListener({
  orgId,
  ticketId,
  currentUserId,
}: Props) {
  const router = useRouter();
  const t = useTranslations("Realtime");

  usePusherChannel<ReplyCreated>(
    `private-org-${orgId}`,
    "reply:created",
    (data) => {
      if (data.ticketId !== ticketId) return;
      if (data.reply.authorId === currentUserId) return;
      toast.message(t("newReply"), {
        description: data.reply.isInternal
          ? t("internalNoteAdded")
          : t("publicReplyAdded", { name: data.reply.authorName ?? "Someone" }),
      });
      router.refresh();
    },
  );

  usePusherChannel<TicketUpdated>(
    `private-org-${orgId}`,
    "ticket:updated",
    (data) => {
      if (data.ticketId !== ticketId) return;
      router.refresh();
    },
  );

  usePusherChannel<{ ticketId: string }>(
    `private-user-${currentUserId}`,
    "ticket:assigned",
    (data) => {
      if (data.ticketId !== ticketId) return;
      toast.success(t("assignedToYou"));
      router.refresh();
    },
  );

  return null;
}
