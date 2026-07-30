"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

type Props = {
  /**
   * URL to navigate to with the new `cursor` query param.
   * `null` means there are no more items.
   */
  nextHref: string | null;
  /**
   * Label for the manual button (also used for a11y).
   */
  label: string;
};

/**
 * Infinite-scroll trigger. Sits at the bottom of a list and:
 * 1. Auto-fetches more when the sentinel scrolls into view
 * 2. Always shows a "Load more" button as a fallback
 *
 * On click / intersection it uses `router.push` so the server component
 * re-renders with the new cursor and the URL stays shareable.
 */
export function LoadMore({ nextHref, label }: Props) {
  const t = useTranslations("Common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!nextHref) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && !armed) {
          setArmed(true);
          startTransition(() => {
            router.push(nextHref);
            // Once the new items arrive, the component re-renders with a
            // fresh nextHref (or null). The flag resets via the `armed`
            // dependency on nextHref below.
          });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [nextHref, armed, router]);

  if (!nextHref) return null;

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div ref={sentinelRef} className="h-1" />
      {pending ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t("loading")}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => startTransition(() => router.push(nextHref))}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          {label}
        </button>
      )}
    </div>
  );
}
