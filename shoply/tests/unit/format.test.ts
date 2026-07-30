import { describe, it, expect } from "vitest"
import { formatOrderStatus, formatPrice, formatDistanceToNow } from "@/lib/format"

describe("formatOrderStatus", () => {
  it("capitalizes the first letter and lowercases the rest", () => {
    expect(formatOrderStatus("PENDING")).toBe("Pending")
    expect(formatOrderStatus("SHIPPED")).toBe("Shipped")
    expect(formatOrderStatus("DELIVERED")).toBe("Delivered")
  })

  it("handles single character status", () => {
    expect(formatOrderStatus("A")).toBe("A")
  })

  it("handles empty string", () => {
    expect(formatOrderStatus("")).toBe("")
  })
})

describe("formatPrice", () => {
  it("formats number to USD", () => {
    expect(formatPrice(10)).toBe("$10.00")
    expect(formatPrice(99.99)).toBe("$99.99")
    expect(formatPrice(0)).toBe("$0.00")
  })

  it("formats string to USD", () => {
    expect(formatPrice("10")).toBe("$10.00")
    expect(formatPrice("99.99")).toBe("$99.99")
  })

  it("handles Decimal-like objects", () => {
    expect(formatPrice({ toString: () => "45.50" })).toBe("$45.50")
  })
})

describe("formatDistanceToNow", () => {
  it("returns 'just now' for less than a minute", () => {
    const now = new Date()
    expect(formatDistanceToNow(now)).toBe("just now")
  })

  it("returns minutes for less than an hour", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatDistanceToNow(date)).toBe("5m ago")
  })

  it("returns hours for less than a day", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatDistanceToNow(date)).toBe("3h ago")
  })

  it("returns days for less than a month", () => {
    const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    expect(formatDistanceToNow(date)).toBe("5d ago")
  })
})
