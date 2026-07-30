"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createRating, type CreateRatingState } from "@/actions/ratings";

type Props = {
  orgSlug: string;
  ticketId: string;
};

const initialState: CreateRatingState = {};

export function RatingForm({ orgSlug, ticketId }: Props) {
  const t = useTranslations("Rating");
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, action, pending] = useActionState<CreateRatingState, FormData>(
    createRating.bind(null, orgSlug, ticketId),
    initialState,
  );

  if (state.success) {
    return (
      <div className="bg-card rounded-lg border p-4 text-sm">
        <p className="font-medium">{t("thanks")}</p>
        <p className="text-muted-foreground mt-1">{t("thanksDescription")}</p>
      </div>
    );
  }

  return (
    <form
      key={state.error ? "err" : "ok"}
      action={action}
      className="bg-card space-y-3 rounded-lg border p-4"
    >
      <input type="hidden" name="score" value={score} />
      <div>
        <p className="font-medium">{t("prompt")}</p>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = (hover || score) >= value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              className="p-1"
              aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
            >
              <Star
                className={`size-6 transition-colors ${
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          );
        })}
      </div>
      <Textarea name="comment" placeholder={t("commentPlaceholder")} rows={3} />
      {state.fieldErrors?.score ? (
        <p className="text-destructive text-xs">{state.fieldErrors.score}</p>
      ) : null}
      {state.fieldErrors?.comment ? (
        <p className="text-destructive text-xs">{state.fieldErrors.comment}</p>
      ) : null}
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!score || pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
