import { describe, expect, it } from 'vitest'
import { Account, Category, Loan } from '../../entities'
import { ValidationException } from '../../exceptions'
import { makeInMemoryDeps } from '../../test/in-memory-repos'
import { makeRecordLoanPayment } from './record-loan-payment'

const financialSpaceId = 'space-1'

function seedPaymentDependencies(deps: ReturnType<typeof makeInMemoryDeps>) {
  const account = Account.create({
    financialSpaceId,
    name: 'Checking',
    type: 'CHECKING',
    balance: 1_000,
    currency: 'USD',
  })
  const category = Category.create({
    financialSpaceId,
    name: 'Debt payments',
    type: 'EXPENSE',
    color: '#000000',
    icon: 'wallet',
  })
  deps.accountRepo.items.push(account)
  deps.categoryRepo.items.push(category)
  return { account, category }
}

describe('makeRecordLoanPayment', () => {
  it('creates an expense transaction, payment, and updates the account and loan', async () => {
    const deps = makeInMemoryDeps()
    const { account, category } = seedPaymentDependencies(deps)
    const loan = Loan.create({
      financialSpaceId,
      lender: 'Bank',
      name: 'Car loan',
      originalPrincipal: 5_000,
      annualRate: 5.5,
      termMonths: 24,
      monthlyPayment: 220,
      startDate: new Date(2026, 0, 1),
      nextPaymentDate: new Date(2026, 1, 15),
    })
    deps.loanRepo.items.push(loan)

    const result = await makeRecordLoanPayment(deps)(financialSpaceId, loan.id, {
      amount: 220,
      date: new Date(2026, 1, 15),
      accountId: account.id,
      categoryId: category.id,
    })

    expect(result.transaction.type).toBe('EXPENSE')
    expect(result.transaction.description).toBe('Pago de préstamo: Car loan')
    expect(result.payment.transactionId).toBe(result.transaction.id)
    expect(account.balance).toBe(780)
    expect(loan.currentBalance).toBe(4_780)
    expect(loan.nextPaymentDate).toEqual(new Date(2026, 2, 15))
    expect(deps.loanRepo.payments).toHaveLength(1)
  })

  it('rejects overpayments before creating related records', async () => {
    const deps = makeInMemoryDeps()
    const { account, category } = seedPaymentDependencies(deps)
    const loan = Loan.create({
      financialSpaceId,
      lender: 'Bank',
      name: 'Small loan',
      originalPrincipal: 100,
      annualRate: 0,
      termMonths: 1,
      monthlyPayment: 100,
      startDate: new Date(2026, 0, 1),
      nextPaymentDate: new Date(2026, 1, 1),
    })
    deps.loanRepo.items.push(loan)

    await expect(
      makeRecordLoanPayment(deps)(financialSpaceId, loan.id, {
        amount: 101,
        date: new Date(2026, 1, 1),
        accountId: account.id,
        categoryId: category.id,
      })
    ).rejects.toBeInstanceOf(ValidationException)

    expect(deps.transactionRepo.items).toHaveLength(0)
    expect(deps.loanRepo.payments).toHaveLength(0)
    expect(account.balance).toBe(1_000)
  })

  it('requires an expense category', async () => {
    const deps = makeInMemoryDeps()
    const { account } = seedPaymentDependencies(deps)
    const incomeCategory = Category.create({
      financialSpaceId,
      name: 'Salary',
      type: 'INCOME',
      color: '#000000',
      icon: 'wallet',
    })
    deps.categoryRepo.items.push(incomeCategory)
    const loan = Loan.create({
      financialSpaceId,
      lender: 'Bank',
      name: 'Loan',
      originalPrincipal: 100,
      annualRate: 0,
      termMonths: 1,
      monthlyPayment: 100,
      startDate: new Date(2026, 0, 1),
      nextPaymentDate: new Date(2026, 1, 1),
    })
    deps.loanRepo.items.push(loan)

    await expect(
      makeRecordLoanPayment(deps)(financialSpaceId, loan.id, {
        amount: 100,
        date: new Date(2026, 1, 1),
        accountId: account.id,
        categoryId: incomeCategory.id,
      })
    ).rejects.toBeInstanceOf(ValidationException)
  })
})
