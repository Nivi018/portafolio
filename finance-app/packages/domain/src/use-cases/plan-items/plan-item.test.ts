import { beforeEach, describe, expect, it } from 'vitest'
import { Account, Category, PlanItem } from '../../entities'
import { NotFoundException, ValidationException } from '../../exceptions'
import { makeInMemoryDeps } from '../../test/in-memory-repos'
import { makeCreatePlanItem } from './create-plan-item'

const FINANCIAL_SPACE_ID = 'space-1'

describe('PlanItem equivalences', () => {
  it.each([
    ['DAILY', 36524.25, 3043.69],
    ['WEEKLY', 5217.75, 434.81],
    ['BIWEEKLY', 2608.88, 217.41],
    ['MONTHLY', 1200, 100],
    ['BIMONTHLY', 600, 50],
    ['QUARTERLY', 400, 33.33],
    ['SEMIANNUAL', 200, 16.67],
    ['YEARLY', 100, 8.33],
  ] as const)('%s uses annualized averages', (frequency, yearlyEquivalent, monthlyEquivalent) => {
    const planItem = PlanItem.create({
      financialSpaceId: FINANCIAL_SPACE_ID,
      name: 'Plan',
      amount: 100,
      type: 'EXPENSE',
      frequency,
    })

    expect(planItem.yearlyEquivalent).toBe(yearlyEquivalent)
    expect(planItem.monthlyEquivalent).toBe(monthlyEquivalent)
  })
})

describe('makeCreatePlanItem', () => {
  let deps: ReturnType<typeof makeInMemoryDeps>

  beforeEach(() => {
    deps = makeInMemoryDeps()
  })

  it('rejects a transfer plan item', () => {
    expect(() =>
      PlanItem.create({
        financialSpaceId: FINANCIAL_SPACE_ID,
        name: 'Transferencia',
        amount: 100,
        type: 'TRANSFER' as never,
        frequency: 'MONTHLY',
      })
    ).toThrow(ValidationException)
  })

  it('rejects an account from another financial space', async () => {
    const account = Account.create({
      name: 'Otra cuenta',
      type: 'CHECKING',
      balance: 0,
      currency: 'MXN',
      financialSpaceId: 'other-space',
    })
    deps.accountRepo.items.push(account)

    await expect(
      makeCreatePlanItem(deps)(FINANCIAL_SPACE_ID, {
        name: 'Renta',
        amount: 100,
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        accountId: account.id,
        isFixed: true,
        isMicroExpense: false,
      })
    ).rejects.toThrow(NotFoundException)
  })

  it('rejects a category from another financial space', async () => {
    const category = Category.create({
      name: 'Otra categoria',
      icon: 'tag',
      color: '#000000',
      type: 'EXPENSE',
      financialSpaceId: 'other-space',
    })
    deps.categoryRepo.items.push(category)

    await expect(
      makeCreatePlanItem(deps)(FINANCIAL_SPACE_ID, {
        name: 'Renta',
        amount: 100,
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        categoryId: category.id,
        isFixed: true,
        isMicroExpense: false,
      })
    ).rejects.toThrow(NotFoundException)
  })
})
