import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { QuestionAnswerCard } from "@/components/admin/question-answer-card"

export const metadata = { title: "Questions" }

export default async function AdminQuestionsPage() {
  const questions = await prisma.productQuestion.findMany({
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const unanswered = questions.filter((q) => !q.answer)
  const answered = questions.filter((q) => q.answer)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <HelpCircle />
          Product Questions
        </h1>
        <p className="text-sm text-muted-foreground">
          {questions.length} total · {unanswered.length} need answer
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{questions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Awaiting answer</p>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {unanswered.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending section */}
      {unanswered.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Awaiting answer ({unanswered.length})
            </span>
          </h2>
          <div className="space-y-3">
            {unanswered.map((q) => (
              <QuestionAnswerCard
                key={q.id}
                question={{
                  id: q.id,
                  question: q.question,
                  answer: q.answer,
                  createdAt: q.createdAt.toISOString(),
                  user: q.user,
                  product: q.product,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Answered */}
      {answered.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Answered ({answered.length})</h2>
          <div className="space-y-3">
            {answered.map((q) => (
              <QuestionAnswerCard
                key={q.id}
                question={{
                  id: q.id,
                  question: q.question,
                  answer: q.answer,
                  createdAt: q.createdAt.toISOString(),
                  user: q.user,
                  product: q.product,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {questions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <HelpCircle className="h-8 w-8 mx-auto mb-3 opacity-30" />
            No questions yet
          </CardContent>
        </Card>
      )}
    </div>
  )
}
