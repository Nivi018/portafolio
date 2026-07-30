import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { highlightMentions } from "@/lib/mentions";
import type { ReplyListItem } from "@/lib/queries/replies";

type Props = {
  replies: ReplyListItem[];
  /** Kept for API stability; filtering is done in the query. */
  role?: string;
  knownUsernames?: Set<string>;
};

function formatDateTime(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function BodyWithMentions({
  text,
  knownUsernames,
}: {
  text: string;
  knownUsernames: Set<string>;
}) {
  const segments = highlightMentions(text, knownUsernames);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <span
            key={i}
            className="bg-primary/10 text-primary rounded px-0.5 font-medium"
          >
            @{seg.value}
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </>
  );
}

export function ReplyList({ replies, role: _role, knownUsernames }: Props) {
  const t = useTranslations("Replies");
  const locale = useLocale();
  const usernameSet = knownUsernames ?? new Set<string>();

  if (replies.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("noReplies")}</p>;
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => (
        <Card
          key={reply.id}
          className={
            reply.isInternal
              ? "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
              : ""
          }
        >
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {reply.author.name ?? reply.author.email}
                </span>
                {reply.isInternal ? (
                  <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-semibold text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">
                    {t("internal")}
                  </span>
                ) : null}
              </div>
              <span className="text-muted-foreground">
                {formatDateTime(reply.createdAt, locale)}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">
              <BodyWithMentions
                text={reply.body}
                knownUsernames={usernameSet}
              />
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
