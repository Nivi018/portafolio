import { NotFoundException, ValidationException } from '../../exceptions'
import type { IAccountRepository } from '../../ports'

export interface DeleteAccountDeps {
  accountRepo: IAccountRepository
}

/**
 * Delete an account only if it has no transactions.
 * Prevents accidental loss of financial history.
 */
export function makeDeleteAccount(deps: DeleteAccountDeps) {
  return async (userId: string, accountId: string): Promise<void> => {
    const account = await deps.accountRepo.findById(accountId)
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Account')
    }

    if (await deps.accountRepo.hasTransactions(accountId)) {
      throw new ValidationException(
        'No puedes eliminar una cuenta con transacciones. Elimina o reasigna las transacciones primero.'
      )
    }

    await deps.accountRepo.delete(accountId)
  }
}
