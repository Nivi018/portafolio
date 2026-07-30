"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bookmark, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SavedView = {
  id: string;
  name: string;
  params: Record<string, string>;
  createdAt: number;
};

const STORAGE_KEY = "tickets:saved-views";

function loadViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedView[]) : [];
  } catch {
    return [];
  }
}

function saveViews(views: SavedView[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

type Props = {
  currentParams: Record<string, string>;
};

export function SavedViewsMenu({ currentParams }: Props) {
  const t = useTranslations("SavedViews");
  const router = useRouter();
  const pathname = usePathname();
  const _sp = useSearchParams();
  const [open, setOpen] = useState(false);
  // Initial state from localStorage (only on the client).
  const [views, setViews] = useState<SavedView[]>(() => loadViews());
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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

  const hasFilters = Object.values(currentParams).some(Boolean);

  function apply(v: SavedView) {
    const next = new URLSearchParams();
    for (const [k, v2] of Object.entries(v.params)) {
      if (v2) next.set(k, v2);
    }
    setOpen(false);
    router.push(`${pathname}?${next.toString()}`);
  }

  function save(name: string) {
    const v: SavedView = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      params: { ...currentParams },
      createdAt: Date.now(),
    };
    const next = [v, ...views].slice(0, 12);
    setViews(next);
    saveViews(next);
  }

  function remove(id: string) {
    const next = views.filter((v) => v.id !== id);
    setViews(next);
    saveViews(next);
  }

  function handleSave() {
    const name = window.prompt(t("promptName"));
    if (name && name.trim()) save(name.trim());
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        className="h-8 gap-1"
      >
        <Bookmark className="size-3" />
        {t("label")}
        <ChevronDown className="size-3" />
      </Button>
      {open ? (
        <div className="bg-popover absolute right-0 z-20 mt-1 w-56 rounded-md border p-1 shadow-lg">
          {views.length > 0 ? (
            <>
              <p className="text-muted-foreground px-2 py-1 text-xs">
                {t("saved")}
              </p>
              {views.map((v) => (
                <div
                  key={v.id}
                  className="hover:bg-muted flex items-center justify-between rounded px-2 py-1 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => startTransition(() => apply(v))}
                    className="flex-1 cursor-pointer text-left"
                  >
                    {v.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(v.id)}
                    className="text-muted-foreground hover:text-destructive ml-2 p-1"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              <div className="bg-border my-1 h-px" />
            </>
          ) : null}

          <button
            type="button"
            onClick={hasFilters ? handleSave : undefined}
            disabled={!hasFilters}
            className="hover:bg-muted w-full cursor-pointer rounded px-2 py-1 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {hasFilters ? t("saveCurrent") : t("noFiltersToSave")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
