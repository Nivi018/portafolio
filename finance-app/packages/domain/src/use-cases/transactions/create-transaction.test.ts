import { describe, it, expect, beforeEach } from 'vitest'
import { Account, Category } from '../../entities'
import { NotFoundException, ValidationException } from '../../exceptions'
import { makeCreateTransaction } from './create-transaction'
import { makeDeleteTransaction } from './delete-transaction'
import { makeUpdateTransaction } from './update-transaction'
import { makeInMemoryDeps } from '../../test/in-memory-repos'

const USER_ID = 'user-1'

function seedAccount(deps: ReturnType<typeof makeInMemoryDeps>, balance = 1000) {
  const account = Account.create({
    name: 'Cuenta principal',
    type: 'CHECKING',
    balance,
    currency: 'MXN',
    userId: USER_ID,
  })
  deps.accountRepo.items.push(account)
  return account
}

function seedCategory(deps: ReturnType<typeof makeInMemoryDeps>, type: 'INCOME' | 'EXPENSE') {
  const category = Category.create({
    name: type === 'EXPENSE' ? 'Alimentación' : 'Salario',
    icon: 'tag',
    color: '#22c55e',
    type,
    userId: USER_ID,
  })
  deps.categoryRepo.items.push(category)
  return category
}

describe('makeCreateTransaction', () => {
  let deps: ReturnType<typeof makeInMemoryDeps>

  beforeEach(() => {
    deps = makeInMemoryDeps()
  })

  it('creates an expense and decrements the account balance', async () => {
    const account = seedAccount(deps, 1000)
    const category = seedCategory(deps, 'EXPENSE')
    const createTransaction = makeCreateTransaction(deps)

    const tx = await createTransaction(USER_ID, {
      amount: 250,
      type: 'EXPENSE',
      categoryId: category.id,
      accountId: account.id,
      date: new Date(),
    })

    expect(tx.amount).toBe(250)
    expect(account.balance).toBe(750)
    expect(deps.transactionRepo.items).toHaveLength(1)
  })

  it('creates an income and increments the account balance', async () => {
    const account = seedAccount(deps, 1000)
    const category = seedCategory(deps, 'INCOME')
    const createTransaction = makeCreateTransaction(deps)

    await createTransaction(USER_ID, {
      amount: 500,
      type: 'INCOME',
      categoryId: category.id,
      accountId: account.id,
      date: new Date(),
    })

    expect(account.balance).toBe(1500)
  })

  it('rejects when the account belongs to another user', async () => {
    const account = seedAccount(deps)
    const category = seedCategory(deps, 'EXPENSE')
    const createTransaction = makeCreateTransaction(deps)

    await expect(
      createTransaction('other-user', {
        amount: 100,
        type: 'EXPENSE',
        categoryId: category.id,
        accountId: account.id,
        date: new Date(),
      })
    ).rejects.toThrow(NotFoundException)
  })

  it('rejects when category type does not match transaction type', async () => {
    const account = seedAccount(deps)
    const incomeCategory = seedCategory(deps, 'INCOME')
    const createTransaction = makeCreateTransaction(deps)

    await expect(
      createTransaction(USER_ID, {
        amount: 100,
        type: 'EXPENSE',
        categoryId: incomeCategory.id,
        accountId: account.id,
        date: new Date(),
      })
    ).rejects.toThrow(ValidationException)
  })
})

describe('makeDeleteTransaction', () => {
  it('deletes a transaction and restores the account balance', async () => {
    const deps = makeInMemoryDeps()
    const account = seedAccount(deps, 1000)
    const category = seedCategory(deps, 'EXPENSE')
    const createTransaction = makeCreateTransaction(deps)
    const deleteTransaction = makeDeleteTransaction(deps)

    const tx = await createTransaction(USER_ID, {
      amount: 400,
      type: 'EXPENSE',
      categoryId: category.id,
      accountId: account.id,
      date: new Date(),
    })
    expect(account.balance).toBe(600)

    await deleteTransaction(USER_ID, tx.id)
    expect(account.balance).toBe(1000)
    expect(deps.transactionRepo.items).toHaveLength(0)
  })
})

describe('makeUpdateTransaction', () => {
  it('reverts and reapplies the balance when editing within the same account', async () => {
    const deps = makeInMemoryDeps()
    const account = seedAccount(deps, 1000)
    const category = seedCategory(deps, 'EXPENSE')
    const createTransaction = makeCreateTransaction(deps)
    const updateTransaction = makeUpdateTransaction(deps)

    const transaction = await createTransaction(USER_ID, {
      amount: 200,
      type: 'EXPENSE',
      categoryId: category.id,
      accountId: account.id,
      date: new Date(),
    })
    expect(account.balance).toBe(800)

    await updateTransaction(USER_ID, transaction.id, { amount: 300 })
    expect(account.balance).toBe(700)
  })
})
