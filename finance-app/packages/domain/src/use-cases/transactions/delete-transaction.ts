import { NotFoundException } from '../../exceptions'
import type { ITransactionRepository, IAccountRepository } from '../../ports'

export interface DeleteTransactionDeps {
  transactionRepo: ITransactionRepository
  accountRepo: IAccountRepository
}

/**
 * Delete a transaction and revert its effect on the account balance.
 */
export function makeDeleteTransaction(deps: DeleteTransactionDeps) {
  return async (userId: string, transactionId: string): Promise<void> => {
    const transaction = await deps.transactionRepo.findById(transactionId)
    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException('Transaction')
    }

    const account = await deps.accountRepo.findById(transaction.accountId)
    if (account) {
      account.revertTransaction(transaction)
      await deps.accountRepo.update(account)
    }

    await deps.transactionRepo.delete(transactionId)
  }
}
