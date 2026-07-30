"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Star, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "@/lib/format"
import {
  adminRespondToReview,
  adminDeleteReviewResponse,
  deleteReview,
  toggleReviewApproval,
} from "@/server/actions/admin-reviews"
import Link from "next/link"

type Review = {
  id: string
  rating: number
  comment: string
  createdAt: string
  approved: boolean
  adminResponse: string | null
  user: { name: string | null; email: string }
  product: { id: string; name: string; slug: string }
}

export function ReviewModerationCard({ review }: { review: Review }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState<"approve" | "respond" | "delete" | "deleteResp" | null>(null)
  const [response, setResponse] = useState("")
  const [showRespond, setShowRespond] = useState(false)

  function handleApprove() {
    setBusy("approve")
    startTransition(async () => {
      const result = await toggleReviewApproval(review.id)
      if (result.ok) {
        toast.success(review.approved ? "Review hidden" : "Review approved")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
      setBusy(null)
    })
  }

  function handleRespond() {
    if (response.length < 10) {
      toast.error("Response must be at least 10 characters")
      return
    }
    setBusy("respond")
    startTransition(async () => {
      const result = await adminRespondToReview({ reviewId: review.id, response })
      if (result.ok) {
        toast.success("Response posted")
        setResponse("")
        setShowRespond(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
      setBusy(null)
    })
  }

  function handleDeleteResponse() {
    if (!confirm("Delete this response?")) return
    setBusy("deleteResp")
    startTransition(async () => {
      const result = await adminDeleteReviewResponse(review.id)
      if (result.ok) {
        toast.success("Response deleted")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
      setBusy(null)
    })
  }

  function handleDelete() {
    if (!confirm("Delete this review? This cannot be undone.")) return
    setBusy("delete")
    startTransition(async () => {
      const result = await deleteReview(review.id)
      if (result.ok) {
        toast.success("Review deleted")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
      setBusy(null)
    })
  }

  return (
    <Card
      className={cn(
        "transition-opacity",
        !review.approved && "border-amber-500/50",
        isPending && "opacity-60",
      )}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{review.user.name ?? "Anonymous"}</span>
              <span className="text-xs text-muted-foreground">({review.user.email})</span>
              {!review.approved && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  Pending
                </Badge>
              )}
            </div>
            <Link
              href={`/products/${review.product.slug}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              on <span className="font-medium">{review.product.name}</span>
            </Link>
            <div className="flex items-center gap-1">
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
              <span className="ml-2 text-xs text-muted-foreground">
                {formatDistanceToNow(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Comment */}
        <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-lg p-3">
          {review.comment}
        </p>

        {/* Existing admin response */}
        {review.adminResponse && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-primary">Shoply response</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteResponse}
                disabled={busy === "deleteResp"}
                className="h-6 px-2"
              >
                {busy === "deleteResp" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-sm">{review.adminResponse}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleApprove}
            disabled={isPending}
          >
            {busy === "approve" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : review.approved ? (
              <X />
            ) : (
              <Check />
            )}
            {review.approved ? "Hide" : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRespond(!showRespond)}
            disabled={isPending}
          >
            {review.adminResponse ? "Edit response" : "Respond"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending}
            className="ml-auto text-muted-foreground hover:text-destructive"
          >
            {busy === "delete" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Delete
          </Button>
        </div>

        {/* Respond form */}
        {showRespond && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              value={response || review.adminResponse || ""}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your public response..."
              rows={3}
              minLength={10}
              maxLength={1000}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRespond} disabled={isPending || response.length < 10}>
                {busy === "respond" && <Loader2 className="h-3 w-3 animate-spin" />}
                Post response
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowRespond(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
