import { describe, it, expect } from "vitest"
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit"

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const result = rateLimit("test-1", 5, 60_000)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("blocks requests over the limit", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("test-2", 5, 60_000)
    }
    const blocked = rateLimit("test-2", 5, 60_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it("resets after window expires", () => {
    for (let i = 0; i < 3; i++) {
      rateLimit("test-3", 3, 50) // 50ms window
    }
    const blocked = rateLimit("test-3", 3, 50)
    expect(blocked.ok).toBe(false)
    // Wait for window to expire
    return new Promise((resolve) => setTimeout(resolve, 60)).then(() => {
      const reset = rateLimit("test-3", 3, 50)
      expect(reset.ok).toBe(true)
      expect(reset.remaining).toBe(2)
    })
  })

  it("isolates different keys", () => {
    rateLimit("user-a", 2, 60_000)
    rateLimit("user-a", 2, 60_000)
    const blocked = rateLimit("user-a", 2, 60_000)
    expect(blocked.ok).toBe(false)
    const otherUser = rateLimit("user-b", 2, 60_000)
    expect(otherUser.ok).toBe(true)
  })
})

describe("getRateLimitKey", () => {
  it("extracts IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    })
    expect(getRateLimitKey(req, "test")).toBe("test:192.168.1.1")
  })

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "192.168.1.2" },
    })
    expect(getRateLimitKey(req, "test")).toBe("test:192.168.1.2")
  })

  it("returns 'unknown' when no IP headers", () => {
    const req = new Request("http://localhost")
    expect(getRateLimitKey(req, "test")).toBe("test:unknown")
  })
})
