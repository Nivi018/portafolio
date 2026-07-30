"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      Sentry.captureException(error, {
        tags: { digest: error.digest ?? "unknown" },
      })
    } else {
      console.error("App error:", error)
    }
  }, [error])

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:py-32 text-center">
      <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        We hit an unexpected error. Our team has been notified.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground font-mono">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" onClick={reset}>
          <RotateCw />
          Try again
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/" />}>
          Back to home
        </Button>
      </div>
    </div>
  )
}
