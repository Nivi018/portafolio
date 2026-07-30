"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Check } from "lucide-react";
import { getPusherClient } from "@/lib/pusher-client";
import { markOneRead, markAllRead } from "@/actions/notifications";

type Notif = {
  id: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
};

type Props = {
  initialUnread: number;
  initialItems: Notif[];
};

export function NotificationsBell({ initialUnread, initialItems }: Props) {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Notif[]>(initialItems);
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to user channel for live updates.
  useEffect(() => {
    const el = document.querySelector("[data-user-id]");
    const userId = el?.getAttribute("data-user-id");
    if (!userId) return;

    const client = getPusherClient();
    if (!client) return;

    const ch = client.subscribe(`private-user-${userId}`);

    const onCount = (data: unknown) => {
      const d = data as { unread: number };
      setUnread(d.unread);
    };
    const onNew = () => {
      startTransition(() => router.refresh());
    };

    ch.bind("notification:count", onCount);
    ch.bind("notification:new", onNew);

    return () => {
      ch.unbind("notification:count", onCount);
      ch.unbind("notification:new", onNew);
      client.unsubscribe(`private-user-${userId}`);
    };
  }, [router]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function handleMarkAll() {
    startTransition(async () => {
      await markAllRead();
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }

  function handleClick(item: Notif) {
    if (!item.read) {
      startTransition(async () => {
        await markOneRead(item.id);
        setUnread((u) => Math.max(0, u - 1));
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
        );
      });
    }
    setOpen(false);
    router.push(item.link);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("title")}
        className="hover:bg-muted relative inline-flex h-9 w-9 items-center justify-center rounded-full focus:outline-none"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="bg-popover absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">{t("title")}</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
              >
                <Check className="size-3" />
                {t("markAllRead")}
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              {t("empty")}
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`hover:bg-muted flex w-full cursor-pointer flex-col items-start gap-0.5 px-3 py-2 text-left text-sm ${
                      n.read ? "" : "bg-muted/40"
                    }`}
                  >
                    <span className="font-medium">{n.title}</span>
                    <span className="text-muted-foreground line-clamp-2 text-xs">
                      {n.body}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
