type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/**
 * Simple in-memory rate limiter. For production, replace with a distributed
 * solution (Upstash Redis, Vercel KV, etc.) so limits work across serverless
 * function instances.
 *
 * @param key - Unique identifier for the client (e.g. `ip:route`)
 * @param limit - Max requests in the window
 * @param windowMs - Window size in milliseconds
 * @returns Object with `ok` (allowed), `remaining` (left in window), `resetAt` (timestamp)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; resetAt: number; limit: number } {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt < now) {
    const bucket = { count: 1, resetAt: now + windowMs }
    buckets.set(key, bucket)
    return { ok: true, remaining: limit - 1, resetAt: bucket.resetAt, limit }
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt, limit }
  }

  existing.count += 1
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    limit,
  }
}

export function getRateLimitKey(request: Request, prefix: string) {
  // Try to get real IP from common proxy headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown"
  return `${prefix}:${ip}`
}

/**
 * Clean up expired buckets periodically to prevent memory leaks.
 * Call this from a route or cron job.
 */
export function cleanupRateLimit(maxAgeMs = 60_000) {
  const now = Date.now()
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt + maxAgeMs < now) {
      buckets.delete(key)
    }
  }
}
