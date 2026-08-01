import { describe, expect, it } from 'vitest'
import { Goal } from './goal.entity'

const reference = new Date(2026, 0, 1)

function goal(overrides: Partial<Parameters<typeof Goal.reconstitute>[0]> = {}) {
  return Goal.reconstitute({
    id: 'goal-1',
    financialSpaceId: 'space-1',
    name: 'Emergency fund',
    targetAmount: 1_000,
    currentAmount: 100,
    deadline: new Date(2027, 0, 1),
    expectedAnnualReturn: 12,
    monthlyContributionTarget: 50,
    createdAt: reference,
    ...overrides,
  })
}

describe('Goal projections', () => {
  it('projects compounded current savings and monthly contributions through the deadline', () => {
    const savingsGoal = goal()

    expect(savingsGoal.getMonthsToDeadline(reference)).toBe(12)
    expect(savingsGoal.getProjectedAmount(reference)).toBeCloseTo(100 * 1.01 ** 12 + 50 * ((1.01 ** 12 - 1) / 0.01), 8)
    expect(savingsGoal.getRequiredMonthlyContribution(reference)).toBeCloseTo(69.964, 2)
    expect(savingsGoal.getProjectionStatus(reference)).toBe('AT_RISK')
  })

  it('handles zero returns and goals without a deadline safely', () => {
    const zeroRateGoal = goal({ expectedAnnualReturn: 0, monthlyContributionTarget: 75 })
    expect(zeroRateGoal.getProjectedAmount(reference)).toBe(1_000)
    expect(zeroRateGoal.getRequiredMonthlyContribution(reference)).toBe(75)
    expect(zeroRateGoal.getProjectionStatus(reference)).toBe('ON_TRACK')

    const noDeadlineGoal = goal({ deadline: null, monthlyContributionTarget: null })
    expect(noDeadlineGoal.getMonthsToDeadline(reference)).toBeNull()
    expect(noDeadlineGoal.getProjectedAmount(reference)).toBeNull()
    expect(noDeadlineGoal.getRequiredMonthlyContribution(reference)).toBeNull()
    expect(noDeadlineGoal.getProjectionStatus(reference)).toBe('UNFUNDED')
  })

  it('marks completed goals without mutating their balance', () => {
    const completedGoal = goal({ currentAmount: 1_000 })
    const balance = completedGoal.currentAmount

    expect(completedGoal.getProjectionStatus(reference)).toBe('COMPLETED')
    expect(completedGoal.currentAmount).toBe(balance)
  })
})
