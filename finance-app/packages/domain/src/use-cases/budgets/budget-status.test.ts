import { describe, it, expect } from 'vitest'
import { Budget, Category, Account, Transaction } from '../../entities'
import { makeCreateBudget } from './create-budget'
import { makeGetBudgetStatuses } from './get-budget-statuses'
import { ValidationException } from '../../exceptions'
import { makeInMemoryDeps } from '../../test/in-memory-repos'

const USER_ID = 'user-1'

describe('budget use cases', () => {
  it('creates a budget for an expense category', async () => {
    const deps = makeInMemoryDeps()
    const category = Category.create({
      name: 'Alimentación',
      icon: 'utensils',
      color: '#f97316',
      type: 'EXPENSE',
      financialSpaceId: USER_ID,
    })
    deps.categoryRepo.items.push(category)

    const createBudget = makeCreateBudget(deps)
    const budget = await createBudget(USER_ID, {
      amount: 5000,
      period: 'MONTHLY',
      categoryId: category.id,
      startDate: new Date(),
    })

    expect(budget.amount).toBe(5000)
    expect(deps.budgetRepo.items).toHaveLength(1)
  })

  it('rejects budgets on income categories', async () => {
    const deps = makeInMemoryDeps()
    const category = Category.create({
      name: 'Salario',
      icon: 'briefcase',
      color: '#22c55e',
      type: 'INCOME',
      financialSpaceId: USER_ID,
    })
    deps.categoryRepo.items.push(category)

    const createBudget = makeCreateBudget(deps)
    await expect(
      createBudget(USER_ID, {
        amount: 5000,
        period: 'MONTHLY',
        categoryId: category.id,
        startDate: new Date(),
      })
    ).rejects.toThrow(ValidationException)
  })

  it('computes live status with spent, remaining and percentage', async () => {
    const deps = makeInMemoryDeps()
    const account = Account.create({
      name: 'Cuenta',
      type: 'CHECKING',
      balance: 10000,
      currency: 'MXN',
      financialSpaceId: USER_ID,
    })
    const category = Category.create({
      name: 'Alimentación',
      icon: 'utensils',
      color: '#f97316',
      type: 'EXPENSE',
      financialSpaceId: USER_ID,
    })
    deps.accountRepo.items.push(account)
    deps.categoryRepo.items.push(category)

    const budget = Budget.create({
      amount: 1000,
      period: 'MONTHLY',
      categoryId: category.id,
      financialSpaceId: USER_ID,
    })
    deps.budgetRepo.items.push(budget)

    // Expense of 250 in the current period
    const tx = Transaction.create({
      amount: 250,
      type: 'EXPENSE',
      categoryId: category.id,
      accountId: account.id,
      financialSpaceId: USER_ID,
      date: new Date(),
    })
    deps.transactionRepo.items.push(tx)

    const getStatuses = makeGetBudgetStatuses(deps)
    const [result] = await getStatuses(USER_ID)

    expect(result!.status.spent).toBe(250)
    expect(result!.status.remaining).toBe(750)
    expect(result!.status.percentage).toBe(25)
    expect(result!.status.isOverBudget).toBe(false)
  })

  it('flags over-budget when spent exceeds amount', async () => {
    const deps = makeInMemoryDeps()
    const account = Account.create({
      name: 'Cuenta',
      type: 'CHECKING',
      balance: 10000,
      currency: 'MXN',
      financialSpaceId: USER_ID,
    })
    const category = Category.create({
      name: 'Compras',
      icon: 'shopping-bag',
      color: '#84cc16',
      type: 'EXPENSE',
      financialSpaceId: USER_ID,
    })
    deps.accountRepo.items.push(account)
    deps.categoryRepo.items.push(category)

    const budget = Budget.create({
      amount: 500,
      period: 'MONTHLY',
      categoryId: category.id,
      financialSpaceId: USER_ID,
    })
    deps.budgetRepo.items.push(budget)

    deps.transactionRepo.items.push(
      Transaction.create({
        amount: 600,
        type: 'EXPENSE',
        categoryId: category.id,
        accountId: account.id,
        financialSpaceId: USER_ID,
        date: new Date(),
      })
    )

    const getStatuses = makeGetBudgetStatuses(deps)
    const [result] = await getStatuses(USER_ID)

    expect(result!.status.isOverBudget).toBe(true)
    expect(result!.status.remaining).toBe(-100)
  })
})
