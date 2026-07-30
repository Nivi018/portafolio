import { describe, it, expect, beforeEach } from 'vitest'
import { Account } from '../../entities'
import { InsufficientFundsException, NotFoundException } from '../../exceptions'
import { makeTransferFunds } from './transfer-funds'
import { makeInMemoryDeps } from '../../test/in-memory-repos'

const USER_ID = 'user-1'

describe('makeTransferFunds', () => {
  let deps: ReturnType<typeof makeInMemoryDeps>

  beforeEach(() => {
    deps = makeInMemoryDeps()
  })

  function seedAccounts(fromBalance = 1000, toBalance = 0) {
    const from = Account.create({
      name: 'Débito',
      type: 'CHECKING',
      balance: fromBalance,
      currency: 'MXN',
      userId: USER_ID,
    })
    const to = Account.create({
      name: 'Ahorro',
      type: 'SAVINGS',
      balance: toBalance,
      currency: 'MXN',
      userId: USER_ID,
    })
    deps.accountRepo.items.push(from, to)
    return { from, to }
  }

  it('moves funds between accounts and records both transactions', async () => {
    const { from, to } = seedAccounts(1000, 200)
    const transfer = makeTransferFunds(deps)

    const result = await transfer(USER_ID, {
      fromAccountId: from.id,
      toAccountId: to.id,
      amount: 300,
      date: new Date(),
    })

    expect(from.balance).toBe(700)
    expect(to.balance).toBe(500)
    expect(deps.transactionRepo.items).toHaveLength(2)
    expect(result.outgoing.isTransfer()).toBe(true)
    expect(result.incoming.isTransfer()).toBe(true)
  })

  it('rejects when source account has insufficient funds', async () => {
    const { from, to } = seedAccounts(100, 0)
    const transfer = makeTransferFunds(deps)

    await expect(
      transfer(USER_ID, {
        fromAccountId: from.id,
        toAccountId: to.id,
        amount: 500,
        date: new Date(),
      })
    ).rejects.toThrow(InsufficientFundsException)

    expect(from.balance).toBe(100)
    expect(to.balance).toBe(0)
  })

  it('allows overdraft from CREDIT accounts', async () => {
    const credit = Account.create({
      name: 'Tarjeta',
      type: 'CREDIT',
      balance: 0,
      currency: 'MXN',
      userId: USER_ID,
    })
    const savings = Account.create({
      name: 'Ahorro',
      type: 'SAVINGS',
      balance: 0,
      currency: 'MXN',
      userId: USER_ID,
    })
    deps.accountRepo.items.push(credit, savings)
    const transfer = makeTransferFunds(deps)

    await transfer(USER_ID, {
      fromAccountId: credit.id,
      toAccountId: savings.id,
      amount: 1000,
      date: new Date(),
    })

    expect(credit.balance).toBe(-1000)
    expect(savings.balance).toBe(1000)
  })

  it('rejects transfer from another user account', async () => {
    const { from, to } = seedAccounts()
    const transfer = makeTransferFunds(deps)

    await expect(
      transfer('other-user', {
        fromAccountId: from.id,
        toAccountId: to.id,
        amount: 100,
        date: new Date(),
      })
    ).rejects.toThrow(NotFoundException)
  })
})
