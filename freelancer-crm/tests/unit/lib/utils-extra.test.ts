import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  generateSlug,
  generateInvoiceNumber,
  getInitials,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  getDaysUntil,
  isOverdue,
} from "@/lib/utils"

describe("Additional Utils Tests", () => {
  describe("formatDateTime", () => {
    it("formats date and time", () => {
      const date = new Date(2024, 0, 15, 14, 30)
      const formatted = formatDateTime(date)
      expect(formatted).toContain("Jan")
      expect(formatted).toContain("15")
      expect(formatted).toContain("2024")
    })

    it("handles date string", () => {
      const formatted = formatDateTime("2024-06-20T10:00:00Z")
      expect(formatted).toBeDefined()
    })
  })

  describe("formatCurrency edge cases", () => {
    it("handles very large numbers", () => {
      expect(formatCurrency(1000000)).toBe("$1,000,000.00")
    })

    it("handles decimal precision", () => {
      expect(formatCurrency(0.01)).toBe("$0.01")
      expect(formatCurrency(99.99)).toBe("$99.99")
    })
  })

  describe("formatDuration edge cases", () => {
    it("formats long durations", () => {
      expect(formatDuration(36000)).toBe("10h 0m")
    })

    it("formats 1 second", () => {
      expect(formatDuration(1)).toBe("1s")
    })

    it("formats 1 hour exactly", () => {
      expect(formatDuration(3600)).toBe("1h 0m")
    })
  })

  describe("generateSlug edge cases", () => {
    it("handles uppercase", () => {
      expect(generateSlug("HELLO WORLD")).toBe("hello-world")
    })

    it("handles numbers", () => {
      expect(generateSlug("Project 123")).toBe("project-123")
    })

    it("handles single word", () => {
      expect(generateSlug("Hello")).toBe("hello")
    })

    it("handles leading/trailing spaces", () => {
      expect(generateSlug("  Hello  ")).toBe("hello")
    })
  })

  describe("getInitials edge cases", () => {
    it("handles empty string", () => {
      expect(getInitials("")).toBe("")
    })

    it("handles three names", () => {
      expect(getInitials("John Michael Doe")).toBe("JM")
    })
  })

  describe("calculateSubtotal edge cases", () => {
    it("handles single item", () => {
      expect(calculateSubtotal([{ quantity: 5, unitPrice: 10 }])).toBe(50)
    })

    it("handles zero values", () => {
      expect(calculateSubtotal([{ quantity: 0, unitPrice: 100 }])).toBe(0)
    })
  })

  describe("getDaysUntil edge cases", () => {
    it("returns 0 for today", () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const days = getDaysUntil(today)
      expect(days).toBeGreaterThanOrEqual(0)
      expect(days).toBeLessThanOrEqual(1)
    })
  })

  describe("isOverdue edge cases", () => {
    it("returns false for today", () => {
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      expect(isOverdue(today)).toBe(false)
    })
  })

  describe("generateInvoiceNumber", () => {
    it("always starts with INV-", () => {
      const num = generateInvoiceNumber()
      expect(num.startsWith("INV-")).toBe(true)
    })

    it("generates numbers of expected length", () => {
      const num = generateInvoiceNumber()
      expect(num.length).toBeGreaterThan(4)
    })
  })
})
