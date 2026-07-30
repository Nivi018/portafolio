/**
 * In-memory token bucket rate limiter.
 *
 * Suitable for single-instance deployments and demos. For production
 * with multiple instances or serverless cold starts, swap with
 * `@upstash/ratelimit` + Upstash Redis.
 *
 * Buckets are keyed by an arbitrary string (usually user id, IP or
 * a combination). Each bucket holds a counter that resets after
 * `windowMs` milliseconds.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

// Periodically prune to avoid unbounded growth.
const PRUNE_INTERVAL_MS = 60_000;
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  }, PRUNE_INTERVAL_MS).unref?.();
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetInMs: number;
  limit: number;
};

export type RateLimitOptions = {
  /** Max number of events allowed in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return {
      ok: true,
      remaining: limit - 1,
      resetInMs: windowMs,
      limit,
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetInMs: existing.resetAt - now,
      limit,
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetInMs: existing.resetAt - now,
    limit,
  };
}

/** Convenience helper for the common "client IP" key. */
export function clientIpKey(headers: Headers, fallback = "anonymous"): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    fallback
  );
}
