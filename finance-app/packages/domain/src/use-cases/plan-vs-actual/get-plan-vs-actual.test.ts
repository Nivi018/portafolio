import { describe, expect, it } from 'vitest'
import { PlanItem, Transaction } from '../../entities'
import { makeInMemoryDeps } from '../../test/in-memory-repos'
import { DateRange } from '../../value-objects'
import { makeGetPlanVsActual } from './get-plan-vs-actual'

describe('makeGetPlanVsActual', () => {
  it('applies the current plan to every month of a full annual range', async () => {
    const deps = makeInMemoryDeps()
    deps.planItemRepo.items.push(
      PlanItem.create({
        financialSpaceId: 'space-1', name: 'Salary', amount: 1_000, type: 'INCOME', frequency: 'MONTHLY', categoryId: 'income',
      }),
      PlanItem.create({
        financialSpaceId: 'space-1', name: 'Rent', amount: 400, type: 'EXPENSE', frequency: 'MONTHLY', categoryId: 'housing',
      })
    )
    deps.transactionRepo.items.push(
      Transaction.create({ financialSpaceId: 'space-1', accountId: 'account-1', categoryId: 'income', type: 'INCOME', amount: 900, date: new Date(2026, 0, 15) }),
      Transaction.create({ financialSpaceId: 'space-1', accountId: 'account-1', categoryId: 'housing', type: 'EXPENSE', amount: 500, date: new Date(2026, 0, 20) }),
      Transaction.create({ financialSpaceId: 'space-1', accountId: 'account-1', categoryId: 'income', type: 'INCOME', amount: 1_100, date: new Date(2026, 11, 15) })
    )

    const result = await makeGetPlanVsActual(deps)(
      'space-1',
      DateRange.of(new Date(2026, 0, 1), new Date(2026, 11, 31))
    )

    expect(result.months).toHaveLength(12)
    expect(result.months.map((row) => row.month)).toEqual([
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
      '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12',
    ])
    expect(result.months[0]).toMatchObject({
      plannedIncome: 1000, plannedExpense: 400, plannedNet: 600,
      actualIncome: 900, actualExpense: 500, actualNet: 400, variance: -200,
      categories: [
        { type: 'EXPENSE', categoryId: 'housing', planned: 400, actual: 500, variance: 100 },
        { type: 'INCOME', categoryId: 'income', planned: 1000, actual: 900, variance: -100 },
      ],
    })
    expect(result.months[11]).toMatchObject({ plannedNet: 600, actualNet: 1100, variance: 500 })
    expect(result).toMatchObject({
      plannedIncome: 12_000, plannedExpense: 4_800, plannedNet: 7_200,
      actualIncome: 2_000, actualExpense: 500, actualNet: 1_500, variance: -5_700,
    })
  })
})
