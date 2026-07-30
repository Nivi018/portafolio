"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessageCircle, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { askProductQuestion, deleteProductQuestion } from "@/server/actions/questions"
import { formatDistanceToNow } from "@/lib/format"

type Question = {
  id: string
  question: string
  answer: string | null
  answeredAt: string | null
  createdAt: string
  user: { id?: string; name: string | null; image: string | null }
}

type Props = {
  productId: string
  questions: Question[]
  isAuthenticated: boolean
  currentUserId?: string
  isAdmin?: boolean
}

export function QuestionsSection({
  productId,
  questions,
  isAuthenticated,
  currentUserId,
  isAdmin,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold">Questions & answers ({questions.length})</h3>
      </div>

      {isAuthenticated ? (
        <QuestionForm productId={productId} />
      ) : (
        <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
          Sign in to ask a question about this product.
        </p>
      )}

      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No questions yet. Be the first to ask!
        </p>
      ) : (
        <div className="space-y-5">
          {questions.map((q) => (
            <div key={q.id} className="space-y-2 border-b pb-5 last:border-0">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={q.user.image ?? undefined} />
                  <AvatarFallback>
                    {(q.user.name ?? "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium text-sm">{q.user.name ?? "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">
                      asked {formatDistanceToNow(q.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{q.question}</p>
                  {q.answer && (
                    <div className="mt-3 rounded-lg border bg-primary/5 border-primary/20 p-3">
                      <p className="text-xs font-semibold text-primary mb-1">
                        Answer from Shoply
                      </p>
                      <p className="text-sm">{q.answer}</p>
                    </div>
                  )}
                </div>
                {(q.user.id && currentUserId === q.user.id) || isAdmin ? (
                  <DeleteQuestionButton questionId={q.id} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuestionForm({ productId }: { productId: string }) {
  const router = useRouter()
  const [question, setQuestion] = useState("")
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (question.trim().length < 10) {
      toast.error("Question must be at least 10 characters")
      return
    }
    startTransition(async () => {
      const result = await askProductQuestion({ productId, question })
      if (result.ok) {
        toast.success("Question posted!")
        setQuestion("")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border bg-muted/30 p-4 space-y-2">
      <Textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What would you like to know about this product?"
        rows={2}
        minLength={10}
        maxLength={500}
        required
      />
      <Button type="submit" size="sm" disabled={isPending || question.length < 10}>
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        <Send />
        Post question
      </Button>
    </form>
  )
}

function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Delete this question?")) return
    startTransition(async () => {
      const result = await deleteProductQuestion(questionId)
      if (result.ok) {
        toast.success("Question deleted")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-muted-foreground hover:text-destructive"
      aria-label="Delete question"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
    </button>
  )
}
