"use client"

import Link from "next/link"
import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-2xl py-16 text-center">
      <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">Admin error</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Failed to load this page. {error.message}
      </p>
      <div className="mt-6 flex gap-3 justify-center">
        <Button onClick={reset}>
          <RotateCw />
          Try again
        </Button>
        <Button variant="outline" render={<Link href="/admin" />}>
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
