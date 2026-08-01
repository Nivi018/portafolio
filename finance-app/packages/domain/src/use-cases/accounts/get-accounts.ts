import type { Account } from '../../entities'
import type { IAccountRepository } from '../../ports'

export interface GetAccountsDeps {
  accountRepo: IAccountRepository
}

export function makeGetAccounts(deps: GetAccountsDeps) {
  return async (financialSpaceId: string): Promise<Account[]> => {
    return deps.accountRepo.findByFinancialSpaceId(financialSpaceId)
  }
}
