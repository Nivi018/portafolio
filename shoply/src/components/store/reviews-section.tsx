"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createReviewAction } from "@/server/actions/reviews"
import { toast } from "sonner"

type Review = {
  id: string
  rating: number
  comment: string
  createdAt: Date | string
  approved: boolean
  adminResponse: string | null
  user: { name: string | null; image: string | null }
}

type Props = {
  productId: string
  reviews: Review[]
  averageRating: number
  totalReviews: number
  canReview: boolean
}

export function ReviewsSection({ productId, reviews, averageRating, totalReviews, canReview }: Props) {
  const visibleReviews = reviews.filter((r) => r.approved)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-5 w-5",
                star <= Math.round(averageRating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30",
              )}
            />
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{averageRating.toFixed(1)}</span> based on{" "}
          {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
        </div>
      </div>

      {canReview && <ReviewForm productId={productId} />}

      {visibleReviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No reviews yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-6">
          {visibleReviews.map((review) => (
            <div key={review.id} className="flex gap-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={review.user.image ?? undefined} />
                <AvatarFallback>
                  {(review.user.name ?? "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{review.user.name ?? "Anonymous"}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3.5 w-3.5",
                          star <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>

                {review.adminResponse && (
                  <div className="mt-3 rounded-lg border bg-primary/5 border-primary/20 p-3">
                    <p className="text-xs font-semibold text-primary mb-1">
                      Response from Shoply
                    </p>
                    <p className="text-sm text-foreground/90">{review.adminResponse}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (comment.trim().length < 10) {
      toast.error("Review must be at least 10 characters")
      return
    }
    startTransition(async () => {
      const result = await createReviewAction({ productId, rating, comment })
      if (result.ok) {
        toast.success("Review posted!")
        setComment("")
        setRating(5)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to post review")
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border bg-muted/30 p-6 space-y-4">
      <div className="space-y-2">
        <Label>Your rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  star <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30 hover:text-muted-foreground/50",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment">Your review</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          minLength={10}
          maxLength={1000}
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Post review
      </Button>
    </form>
  )
}
