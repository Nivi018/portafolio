import type { TransactionFiltersOutput } from '@finance/shared'
import type { Transaction } from '../../entities'
import type { ITransactionRepository, PaginatedResult } from '../../ports'

export interface GetTransactionsDeps {
  transactionRepo: ITransactionRepository
}

/**
 * List transactions for a user with filters and pagination.
 */
export function makeGetTransactions(deps: GetTransactionsDeps) {
  return async (
    userId: string,
    filters: TransactionFiltersOutput
  ): Promise<PaginatedResult<Transaction>> => {
    return deps.transactionRepo.findByUserId(userId, filters)
  }
}
