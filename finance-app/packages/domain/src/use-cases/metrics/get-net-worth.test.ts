import { describe, expect, it } from 'vitest'
import { Account, Asset, Loan, makeGetNetWorth } from '../../index'
import { InMemoryAccountRepository, InMemoryAssetRepository, InMemoryLoanRepository } from '../../test/in-memory-repos'

describe('get net worth', () => {
  it('adds positive non-credit balances and assets, then subtracts credit debt and loans', async () => {
    const accountRepo = new InMemoryAccountRepository()
    const assetRepo = new InMemoryAssetRepository()
    const loanRepo = new InMemoryLoanRepository()
    const spaceId = 'space-1'
    accountRepo.items.push(
      Account.reconstitute({ id: 'checking', financialSpaceId: spaceId, name: 'Checking', type: 'CHECKING', balance: 500, currency: 'MXN', createdAt: new Date(), updatedAt: new Date() }),
      Account.reconstitute({ id: 'overdrawn', financialSpaceId: spaceId, name: 'Cash', type: 'CASH', balance: -50, currency: 'MXN', createdAt: new Date(), updatedAt: new Date() }),
      Account.reconstitute({ id: 'card', financialSpaceId: spaceId, name: 'Card', type: 'CREDIT', balance: -300, currency: 'MXN', createdAt: new Date(), updatedAt: new Date() }),
    )
    assetRepo.items.push(Asset.reconstitute({ id: 'asset', financialSpaceId: spaceId, name: 'Car', type: 'VEHICLE', currentValue: 4000, notes: null, createdAt: new Date(), updatedAt: new Date() }))
    loanRepo.items.push(Loan.reconstitute({ id: 'loan', financialSpaceId: spaceId, lender: 'Bank', name: 'Loan', originalPrincipal: 1000, currentBalance: 700, annualRate: 0, termMonths: 12, monthlyPayment: 100, startDate: new Date(), nextPaymentDate: new Date(), createdAt: new Date(), updatedAt: new Date() }))
    await expect(makeGetNetWorth({ accountRepo, assetRepo, loanRepo })(spaceId)).resolves.toEqual({ assets: 4500, liabilities: 1000, netWorth: 3500 })
  })
})
