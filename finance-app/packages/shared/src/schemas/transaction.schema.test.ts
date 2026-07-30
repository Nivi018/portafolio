import { describe, it, expect } from 'vitest'
import {
  createTransactionSchema,
  transactionFiltersSchema,
  csvTransactionRowSchema,
} from './transaction.schema'

describe('createTransactionSchema', () => {
  it('accepts a valid transaction', () => {
    const result = createTransactionSchema.safeParse({
      amount: 150.5,
      type: 'EXPENSE',
      categoryId: 'cat-1',
      accountId: 'acc-1',
      description: 'Groceries',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(150.5)
      expect(result.data.date).toBeInstanceOf(Date) // default applied
    }
  })

  it('rejects negative amounts', () => {
    const result = createTransactionSchema.safeParse({
      amount: -10,
      type: 'EXPENSE',
      categoryId: 'cat-1',
      accountId: 'acc-1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = createTransactionSchema.safeParse({
      amount: 10,
      type: 'INVALID',
      categoryId: 'cat-1',
      accountId: 'acc-1',
    })
    expect(result.success).toBe(false)
  })

  it('coerces ISO date strings to Date', () => {
    const result = createTransactionSchema.safeParse({
      amount: 100,
      type: 'INCOME',
      categoryId: 'cat-1',
      accountId: 'acc-1',
      date: '2026-07-15T10:00:00.000Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date)
      expect(result.data.date.toISOString()).toBe('2026-07-15T10:00:00.000Z')
    }
  })
})

describe('transactionFiltersSchema', () => {
  it('applies pagination defaults', () => {
    const result = transactionFiltersSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('coerces query string numbers', () => {
    const result = transactionFiltersSchema.parse({ page: '2', limit: '50' })
    expect(result.page).toBe(2)
    expect(result.limit).toBe(50)
  })

  it('rejects limit above max', () => {
    const result = transactionFiltersSchema.safeParse({ limit: 500 })
    expect(result.success).toBe(false)
  })

  it('accepts full filter set', () => {
    const result = transactionFiltersSchema.safeParse({
      type: 'EXPENSE',
      categoryId: 'cat-1',
      accountId: 'acc-1',
      from: '2026-01-01',
      to: '2026-12-31',
      search: 'supermarket',
    })
    expect(result.success).toBe(true)
  })
})

describe('csvTransactionRowSchema', () => {
  it('parses a valid CSV row', () => {
    const result = csvTransactionRowSchema.safeParse({
      date: '2026-07-01',
      amount: '250.00',
      type: 'EXPENSE',
      category: 'Alimentación',
      description: 'Weekly groceries',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(250)
      expect(result.data.date).toBeInstanceOf(Date)
    }
  })

  it('rejects invalid type in CSV row', () => {
    const result = csvTransactionRowSchema.safeParse({
      date: '2026-07-01',
      amount: '100',
      type: 'TRANSFER',
      category: 'X',
    })
    expect(result.success).toBe(false)
  })
})
