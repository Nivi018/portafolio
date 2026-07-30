"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Tracks the current product as a "recently viewed" item via a cookie.
 * Renders nothing — purely a side-effect component.
 */
const COOKIE_NAME = "shoply_recently_viewed"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const MAX_ITEMS = 6

export function TrackProductView({ productId }: { productId: string }) {
  const pathname = usePathname()

  useEffect(() => {
    if (!productId) return

    const cookies = document.cookie.split(";")
    const existing = cookies
      .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1]
    let ids: string[] = []
    if (existing) {
      try {
        ids = decodeURIComponent(existing).split(",").filter(Boolean)
      } catch {
        ids = []
      }
    }
    // Remove the current product if it's already in the list
    ids = ids.filter((id) => id !== productId)
    // Add the current product at the start
    ids.unshift(productId)
    // Limit to MAX_ITEMS
    ids = ids.slice(0, MAX_ITEMS)

    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
      ids.join(","),
    )}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
  }, [pathname, productId])

  return null
}
