import { describe, expect, it } from 'vitest'
import { simulateCredit } from './simulate-credit'

describe('simulateCredit', () => {
  it('calculates a zero-rate loan with equal principal payments', () => {
    const result = simulateCredit({ principal: 1200, annualRate: 0, termMonths: 12 })

    expect(result.monthlyPayment).toBe(100)
    expect(result.totalInterest).toBe(0)
    expect(result.totalCost).toBe(1200)
    expect(result.schedule).toHaveLength(12)
    expect(result.schedule.at(-1)?.balance).toBe(0)
  })

  it('generates the expected amortized payment and balance', () => {
    const result = simulateCredit({ principal: 10000, annualRate: 12, termMonths: 12 })

    expect(result.monthlyPayment).toBe(888.49)
    expect(result.totalInterest).toBe(661.86)
    expect(result.schedule[0]).toMatchObject({ month: 1, interest: 100, principal: 788.49, balance: 9211.51 })
    expect(result.schedule.at(-1)?.balance).toBe(0)
  })

  it('applies extra payments to principal and shortens the loan', () => {
    const base = simulateCredit({ principal: 10000, annualRate: 12, termMonths: 24 })
    const accelerated = simulateCredit({ principal: 10000, annualRate: 12, termMonths: 24, monthlyExtraPayment: 100 })

    expect(accelerated.schedule[0]?.extraPayment).toBe(100)
    expect(accelerated.payoffMonths).toBeLessThan(base.payoffMonths)
    expect(accelerated.totalInterest).toBeLessThan(base.totalInterest)
  })
})
