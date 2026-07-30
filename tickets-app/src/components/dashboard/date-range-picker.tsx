"use client";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

type Props = {
  current: number;
  options: readonly number[];
  orgSlug: string;
};

export function DateRangePicker({ current, options, orgSlug }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(days: number) {
    if (days === current) return;
    startTransition(() => {
      router.push(
        days === 14
          ? `/app/${orgSlug}/reports`
          : `/app/${orgSlug}/reports?days=${days}`,
      );
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-md border p-1">
      {options.map((d) => (
        <Button
          key={d}
          size="sm"
          variant={d === current ? "default" : "ghost"}
          onClick={() => change(d)}
          disabled={pending}
          className="h-7 px-2 text-xs"
        >
          {d}d
        </Button>
      ))}
    </div>
  );
}
