import { describe, it, expect, beforeEach } from 'vitest'
import { Account, Category, RecurringTransaction } from '../../entities'
import { makeProcessDueRecurring } from './process-due-recurring'
import { makeInMemoryDeps } from '../../test/in-memory-repos'

const USER_ID = 'user-1'

describe('makeProcessDueRecurring', () => {
  let deps: ReturnType<typeof makeInMemoryDeps>

  beforeEach(() => {
    deps = makeInMemoryDeps()
  })

  function setup() {
    const account = Account.create({
      name: 'Cuenta',
      type: 'CHECKING',
      balance: 5000,
      currency: 'MXN',
      financialSpaceId: USER_ID,
    })
    const category = Category.create({
      name: 'Servicios',
      icon: 'zap',
      color: '#eab308',
      type: 'EXPENSE',
      financialSpaceId: USER_ID,
    })
    deps.accountRepo.items.push(account)
    deps.categoryRepo.items.push(category)
    return { account, category }
  }

  it('generates transactions for due recurring items and advances schedule', async () => {
    const { account, category } = setup()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const recurring = RecurringTransaction.create({
      amount: 500,
      description: 'Netflix',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      nextDueDate: yesterday,
      categoryId: category.id,
      accountId: account.id,
      financialSpaceId: USER_ID,
    })
    deps.recurringRepo.items.push(recurring)

    const process = makeProcessDueRecurring(deps)
    const result = await process(new Date())

    expect(result.processed).toBe(1)
    expect(result.failed).toBe(0)
    expect(deps.transactionRepo.items).toHaveLength(1)
    expect(account.balance).toBe(4500)
    expect(recurring.nextDueDate.getTime()).toBeGreaterThan(Date.now())
  })

  it('catches up on multiple missed periods', async () => {
    const { account, category } = setup()
    const twentyDaysAgo = new Date()
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20)

    const recurring = RecurringTransaction.create({
      amount: 100,
      description: 'Gym semanal',
      type: 'EXPENSE',
      frequency: 'WEEKLY',
      nextDueDate: twentyDaysAgo,
      categoryId: category.id,
      accountId: account.id,
      financialSpaceId: USER_ID,
    })
    deps.recurringRepo.items.push(recurring)

    const process = makeProcessDueRecurring(deps)
    const result = await process(new Date())

    expect(result.processed).toBe(3)
    expect(deps.transactionRepo.items).toHaveLength(3)
    expect(account.balance).toBe(4700)
  })

  it('skips inactive recurring items', async () => {
    const { account, category } = setup()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const recurring = RecurringTransaction.create({
      amount: 500,
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      nextDueDate: yesterday,
      categoryId: category.id,
      accountId: account.id,
      financialSpaceId: USER_ID,
    })
    recurring.deactivate()
    deps.recurringRepo.items.push(recurring)

    const process = makeProcessDueRecurring(deps)
    const result = await process(new Date())

    expect(result.processed).toBe(0)
    expect(account.balance).toBe(5000)
  })
})
