import type { CreditCardSummaryDto, CreditUtilizationAlert } from '@finance/shared'
import type { IAccountRepository, ICreditCardProfileRepository } from '../../ports'

export interface GetCreditCardSummariesDeps {
  accountRepo: IAccountRepository
  creditCardProfileRepo: ICreditCardProfileRepository
}

/** Utilization alerts begin at 30%, become high at 70%, and are over-limit at 100%. */
export function makeGetCreditCardSummaries(deps: GetCreditCardSummariesDeps) {
  return async (financialSpaceId: string): Promise<CreditCardSummaryDto[]> => {
    const profiles = await deps.creditCardProfileRepo.findByFinancialSpaceId(financialSpaceId)
    const accounts = await deps.accountRepo.findByFinancialSpaceId(financialSpaceId)
    const accountsById = new Map(accounts.filter((account) => account.isCredit()).map((account) => [account.id, account]))

    return profiles.flatMap((profile) => {
      const account = accountsById.get(profile.accountId)
      if (!account) return []
      const debt = Math.max(0, -account.balance)
      const utilization = (debt / profile.creditLimit) * 100
      const utilizationAlert: CreditUtilizationAlert = utilization >= 100 ? 'OVER_LIMIT' : utilization >= 70 ? 'HIGH' : utilization >= 30 ? 'ATTENTION' : 'NONE'
      return [{
        id: profile.id, accountId: profile.accountId, bank: profile.bank, product: profile.product,
        creditLimit: profile.creditLimit, apr: profile.apr, statementCloseDay: profile.statementCloseDay, paymentDueDay: profile.paymentDueDay,
        createdAt: profile.createdAt.toISOString(), updatedAt: profile.updatedAt.toISOString(),
        accountName: account.name, currency: account.currency, balance: account.balance, debt, utilization,
        availableCredit: Math.max(0, profile.creditLimit - debt), utilizationAlert,
      }]
    })
  }
}
