import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReviewModerationCard } from "@/components/admin/review-moderation-card"
import { MessageSquare, Star } from "lucide-react"

export const metadata = { title: "Reviews" }

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const pending = reviews.filter((r) => !r.approved)
  const answered = reviews.filter((r) => r.approved && r.adminResponse)
  const unanswered = reviews.filter((r) => r.approved && !r.adminResponse)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <MessageSquare />
          Reviews
        </h1>
        <p className="text-sm text-muted-foreground">
          {reviews.length} total · {pending.length} pending · {unanswered.length} need response
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{reviews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {pending.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Answered</p>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {answered.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending section */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              {pending.length}
            </Badge>
            Pending approval
          </h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <ReviewModerationCard
                key={r.id}
                review={{
                  id: r.id,
                  rating: r.rating,
                  comment: r.comment,
                  createdAt: r.createdAt.toISOString(),
                  approved: r.approved,
                  adminResponse: r.adminResponse,
                  user: r.user,
                  product: r.product,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* All reviews */}
      <section>
        <h2 className="text-lg font-semibold mb-3">All reviews</h2>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
              No reviews yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewModerationCard
                key={r.id}
                review={{
                  id: r.id,
                  rating: r.rating,
                  comment: r.comment,
                  createdAt: r.createdAt.toISOString(),
                  approved: r.approved,
                  adminResponse: r.adminResponse,
                  user: r.user,
                  product: r.product,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
