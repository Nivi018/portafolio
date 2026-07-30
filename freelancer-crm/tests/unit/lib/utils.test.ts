import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDuration,
  generateSlug,
  generateInvoiceNumber,
  getInitials,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  getDaysUntil,
  isOverdue,
} from '@/lib/utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('handles negative values', () => {
      expect(formatCurrency(-500)).toBe('-$500.00')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date(2024, 0, 15) // Jan 15, 2024 (local time)
      const formatted = formatDate(date)
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('handles date string', () => {
      const date = new Date(2024, 5, 20) // Jun 20, 2024
      const formatted = formatDate(date)
      expect(formatted).toContain('Jun')
      expect(formatted).toContain('20')
    })
  })

  describe('formatDuration', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(3661)).toBe('1h 1m')
      expect(formatDuration(3600)).toBe('1h 0m')
      expect(formatDuration(60)).toBe('1m 0s')
      expect(formatDuration(30)).toBe('30s')
    })

    it('handles zero', () => {
      expect(formatDuration(0)).toBe('0s')
    })
  })

  describe('generateSlug', () => {
    it('generates slug from text', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('My Project Name')).toBe('my-project-name')
    })

    it('removes special characters', () => {
      expect(generateSlug('Hello! @World#')).toBe('hello-world')
    })

    it('handles multiple spaces', () => {
      expect(generateSlug('Hello   World')).toBe('hello-world')
    })
  })

  describe('generateInvoiceNumber', () => {
    it('generates invoice number with prefix', () => {
      const invoiceNumber = generateInvoiceNumber()
      expect(invoiceNumber).toMatch(/^INV-/)
    })

    it('generates unique numbers', () => {
      const num1 = generateInvoiceNumber()
      const num2 = generateInvoiceNumber()
      expect(num1).not.toBe(num2)
    })
  })

  describe('getInitials', () => {
    it('returns initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Smith')).toBe('JS')
    })

    it('handles single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('limits to 2 characters', () => {
      expect(getInitials('John Michael Doe')).toBe('JM')
    })
  })

  describe('calculateSubtotal', () => {
    it('calculates subtotal correctly', () => {
      const items = [
        { quantity: 2, unitPrice: 100 },
        { quantity: 1, unitPrice: 50 },
      ]
      expect(calculateSubtotal(items)).toBe(250)
    })

    it('handles empty array', () => {
      expect(calculateSubtotal([])).toBe(0)
    })
  })

  describe('calculateTax', () => {
    it('calculates tax correctly', () => {
      expect(calculateTax(1000, 10)).toBe(100)
      expect(calculateTax(1000, 0)).toBe(0)
      expect(calculateTax(0, 10)).toBe(0)
    })
  })

  describe('calculateTotal', () => {
    it('calculates total correctly', () => {
      expect(calculateTotal(1000, 100)).toBe(1100)
      expect(calculateTotal(0, 0)).toBe(0)
    })
  })

  describe('getDaysUntil', () => {
    it('calculates days until date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      expect(getDaysUntil(futureDate)).toBeGreaterThanOrEqual(4)
      expect(getDaysUntil(futureDate)).toBeLessThanOrEqual(5)
    })

    it('returns negative for past dates', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      expect(getDaysUntil(pastDate)).toBeLessThan(0)
    })
  })

  describe('isOverdue', () => {
    it('returns true for past dates', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(isOverdue(pastDate)).toBe(true)
    })

    it('returns false for future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      expect(isOverdue(futureDate)).toBe(false)
    })
  })
})
