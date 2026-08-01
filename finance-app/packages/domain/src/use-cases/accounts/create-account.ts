import type { CreateAccountInput } from '@finance/shared'
import { Account } from '../../entities'
import type { IAccountRepository } from '../../ports'

export interface CreateAccountDeps {
  accountRepo: IAccountRepository
}

export function makeCreateAccount(deps: CreateAccountDeps) {
  return async (financialSpaceId: string, input: CreateAccountInput): Promise<Account> => {
    const account = Account.create({ ...input, financialSpaceId })
    return deps.accountRepo.create(account)
  }
}
