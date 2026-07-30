"use client";

import { useEffect } from "react";
import { getPusherClient } from "@/lib/pusher-client";

type Handler<T = unknown> = (data: T) => void;

export function usePusherChannel<T = unknown>(
  channelName: string | null,
  event: string,
  handler: Handler<T>,
  deps: ReadonlyArray<unknown> = [],
) {
  useEffect(() => {
    if (!channelName) return;
    const client = getPusherClient();
    if (!client) return;

    const channel = client.subscribe(channelName);
    const cb = (data: T) => handler(data);
    channel.bind(event, cb);

    return () => {
      channel.unbind(event, cb);
      client.unsubscribe(channelName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, event, ...deps]);
}
