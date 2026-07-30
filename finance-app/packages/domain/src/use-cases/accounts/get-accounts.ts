import type { Account } from '../../entities'
import type { IAccountRepository } from '../../ports'

export interface GetAccountsDeps {
  accountRepo: IAccountRepository
}

export function makeGetAccounts(deps: GetAccountsDeps) {
  return async (userId: string): Promise<Account[]> => {
    return deps.accountRepo.findByUserId(userId)
  }
}
