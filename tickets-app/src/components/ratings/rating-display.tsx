import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

type Props = {
  score: number;
  comment: string | null;
};

export function RatingDisplay({ score, comment }: Props) {
  const t = useTranslations("Rating");

  return (
    <div className="bg-card rounded-lg border p-4 text-sm">
      <p className="text-muted-foreground text-xs">{t("yourRating")}</p>
      <div className="mt-1 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={`size-5 ${
              score >= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
      {comment ? (
        <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
          {comment}
        </p>
      ) : null}
      <p className="text-muted-foreground mt-2 text-xs">{t("thanksShort")}</p>
    </div>
  );
}
