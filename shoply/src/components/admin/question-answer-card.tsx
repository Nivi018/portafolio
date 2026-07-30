"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Loader2, Send, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { answerProductQuestion, deleteProductQuestion } from "@/server/actions/questions"
import { formatDistanceToNow } from "@/lib/format"

type Question = {
  id: string
  question: string
  answer: string | null
  createdAt: string
  user: { name: string | null; email: string }
  product: { id: string; name: string; slug: string }
}

export function QuestionAnswerCard({ question }: { question: Question }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState<"answer" | "delete" | null>(null)
  const [answer, setAnswer] = useState("")
  const [showForm, setShowForm] = useState(!question.answer)

  function handleAnswer() {
    if (answer.length < 5) {
      toast.error("Answer must be at least 5 characters")
      return
    }
    setBusy("answer")
    startTransition(async () => {
      const result = await answerProductQuestion({
        questionId: question.id,
        answer,
      })
      if (result.ok) {
        toast.success("Answer posted")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
      setBusy(null)
    })
  }

  function handleDelete() {
    if (!confirm("Delete this question?")) return
    setBusy("delete")
    startTransition(async () => {
      const result = await deleteProductQuestion(question.id)
      if (result.ok) {
        toast.success("Deleted")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
      setBusy(null)
    })
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={undefined} />
            <AvatarFallback>
              {(question.user.name ?? "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{question.user.name ?? "Anonymous"}</span>
              <span className="text-xs text-muted-foreground">({question.user.email})</span>
            </div>
            <Link
              href={`/products/${question.product.slug}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              on <span className="font-medium">{question.product.name}</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              asked {formatDistanceToNow(question.createdAt)}
            </p>
          </div>
        </div>

        <p className="text-sm bg-muted/40 rounded-lg p-3">{question.question}</p>

        {question.answer ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              Your answer
            </p>
            <p className="text-sm">{question.answer}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(true)}
              className="mt-2"
            >
              Edit answer
            </Button>
          </div>
        ) : null}

        {showForm && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              value={answer || question.answer || ""}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your answer..."
              rows={3}
              minLength={5}
              maxLength={1000}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAnswer} disabled={isPending || answer.length < 5}>
                {busy === "answer" && <Loader2 className="h-3 w-3 animate-spin" />}
                <Send />
                {question.answer ? "Update" : "Post"} answer
              </Button>
              {question.answer && (
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            {busy === "delete" && <Loader2 className="h-3 w-3 animate-spin" />}
            <X />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
