"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReply, type CreateReplyState } from "@/actions/replies";
import { searchMentionableUsers } from "@/actions/mentions";
import { getCannedResponsesForOrg } from "@/actions/canned-responses";

type MentionUser = { id: string; name: string | null; email: string };
type CannedItem = { id: string; title: string; body: string };

type Props = {
  orgSlug: string;
  ticketId: string;
  role: Role;
  disabled?: boolean;
};

const initialState: CreateReplyState = {};

export function ReplyComposer({ orgSlug, ticketId, role, disabled }: Props) {
  const t = useTranslations("Replies");
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [state, action, pending] = useActionState<CreateReplyState, FormData>(
    createReply.bind(null, orgSlug, ticketId),
    initialState,
  );

  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [canned, setCanned] = useState<CannedItem[]>([]);
  const [showCanned, setShowCanned] = useState(false);
  const canCanned = role === Role.AGENT || role === Role.ADMIN;

  // Lazy-load canned responses on first dropdown open.
  function openCanned() {
    setShowCanned((v) => !v);
    if (canned.length === 0) {
      void getCannedResponsesForOrg().then(setCanned);
    }
  }

  function pickCanned(item: CannedItem) {
    setBody((prev) => (prev ? `${prev}\n\n${item.body}` : item.body));
    setShowCanned(false);
    textareaRef.current?.focus();
  }

  const canInternal = role === Role.AGENT || role === Role.ADMIN;

  // Reset form when state changes (success clears, error stays).
  // We use the `formKey` to force-recreate the form on success.
  const [formKey, setFormKey] = useState(0);
  if (state.success && formKey === 0) {
    setFormKey(1);
  }

  // Fetch mention candidates when query changes.
  useEffect(() => {
    if (!showMentions || mentionQuery.length === 0) {
      return;
    }
    let cancelled = false;
    void searchMentionableUsers(mentionQuery).then((users) => {
      if (!cancelled) {
        setMentionResults(users);
        setMentionIndex(0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mentionQuery, showMentions]);

  function onBodyChange(value: string) {
    setBody(value);
    const cursor = value.slice(0, textareaRef.current?.selectionStart ?? 0);
    const match = /(?:^|\s)@([a-zA-Z0-9_.-]*)$/.exec(cursor);
    if (match) {
      setShowMentions(true);
      setMentionQuery(match[1]);
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }
  }

  function pickMention(user: MentionUser) {
    const before = body.slice(0, textareaRef.current?.selectionStart ?? 0);
    const afterCursor = body.slice(textareaRef.current?.selectionStart ?? 0);
    const replaced = before.replace(
      /(?:^|\s)@[a-zA-Z0-9_.-]*$/,
      (m) => `${m.replace(/@[a-zA-Z0-9_.-]*$/, "")}@${user.email} `,
    );
    setBody(`${replaced}${afterCursor}`);
    setShowMentions(false);
    setMentionQuery("");
    textareaRef.current?.focus();
  }

  return (
    <form key={formKey} action={action} className="space-y-3">
      <div className="relative">
        <Textarea
          name="body"
          ref={textareaRef}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={t("placeholder")}
          rows={4}
          disabled={disabled}
          required
        />
        {showMentions && mentionResults.length > 0 ? (
          <div className="bg-popover absolute right-0 left-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-md border shadow-lg">
            {mentionResults.map((u, i) => (
              <button
                type="button"
                key={u.id}
                onClick={() => pickMention(u)}
                className={`hover:bg-muted flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                  i === mentionIndex ? "bg-muted" : ""
                }`}
              >
                <span className="font-medium">{u.name ?? u.email}</span>
                <span className="text-muted-foreground text-xs">{u.email}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {state.fieldErrors?.body ? (
        <p className="text-destructive text-xs">{state.fieldErrors.body}</p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {canInternal ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isInternal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="size-4"
              />
              {t("internalNote")}
            </label>
          ) : null}
          {canCanned ? (
            <div className="relative">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={openCanned}
                disabled={disabled}
              >
                <BookText className="size-3" />
                {t("cannedResponses")}
              </Button>
              {showCanned ? (
                <div className="bg-popover absolute bottom-full left-0 z-10 mb-1 max-h-56 w-72 overflow-y-auto rounded-md border shadow-lg">
                  {canned.length === 0 ? (
                    <p className="text-muted-foreground px-3 py-2 text-xs">
                      {t("noCanned")}
                    </p>
                  ) : (
                    canned.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCanned(c)}
                        className="hover:bg-muted flex w-full flex-col items-start px-3 py-2 text-left text-sm"
                      >
                        <span className="font-medium">{c.title}</span>
                        <span className="text-muted-foreground line-clamp-2 text-xs">
                          {c.body}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <Button type="submit" disabled={pending || disabled}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </div>
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
    </form>
  );
}
