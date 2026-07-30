import type { UpdateAccountInput } from '@finance/shared'
import type { Account } from '../../entities'
import { NotFoundException } from '../../exceptions'
import type { IAccountRepository } from '../../ports'

export interface UpdateAccountDeps {
  accountRepo: IAccountRepository
}

export function makeUpdateAccount(deps: UpdateAccountDeps) {
  return async (userId: string, accountId: string, input: UpdateAccountInput): Promise<Account> => {
    const account = await deps.accountRepo.findById(accountId)
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Account')
    }

    if (input.name !== undefined) account.rename(input.name)
    if (input.type !== undefined) account.changeType(input.type)
    if (input.currency !== undefined) account.changeCurrency(input.currency)

    return deps.accountRepo.update(account)
  }
}
