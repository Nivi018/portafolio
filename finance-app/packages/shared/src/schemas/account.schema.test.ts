import { describe, it, expect } from 'vitest'
import { createAccountSchema, transferFundsSchema } from './account.schema'

describe('createAccountSchema', () => {
  it('accepts a valid account with defaults', () => {
    const result = createAccountSchema.safeParse({
      name: 'Cuenta nómina',
      type: 'CHECKING',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.balance).toBe(0)
      expect(result.data.currency).toBe('MXN')
    }
  })

  it('rejects invalid account type', () => {
    const result = createAccountSchema.safeParse({
      name: 'X',
      type: 'CRYPTO',
    })
    expect(result.success).toBe(false)
  })
})

describe('transferFundsSchema', () => {
  it('accepts a valid transfer', () => {
    const result = transferFundsSchema.safeParse({
      fromAccountId: 'acc-1',
      toAccountId: 'acc-2',
      amount: 500,
    })
    expect(result.success).toBe(true)
  })

  it('rejects transfer to same account', () => {
    const result = transferFundsSchema.safeParse({
      fromAccountId: 'acc-1',
      toAccountId: 'acc-1',
      amount: 500,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('toAccountId')
    }
  })

  it('rejects non-positive amount', () => {
    const result = transferFundsSchema.safeParse({
      fromAccountId: 'acc-1',
      toAccountId: 'acc-2',
      amount: 0,
    })
    expect(result.success).toBe(false)
  })
})
