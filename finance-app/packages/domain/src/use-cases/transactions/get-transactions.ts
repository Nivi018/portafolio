import type { TransactionFiltersOutput } from '@finance/shared'
import type { Transaction } from '../../entities'
import type { ITransactionRepository, PaginatedResult } from '../../ports'

export interface GetTransactionsDeps {
  transactionRepo: ITransactionRepository
}

/**
 * List transactions for a financial space with filters and pagination.
 */
export function makeGetTransactions(deps: GetTransactionsDeps) {
  return async (
    financialSpaceId: string,
    filters: TransactionFiltersOutput
  ): Promise<PaginatedResult<Transaction>> => {
    return deps.transactionRepo.findByFinancialSpaceId(financialSpaceId, filters)
  }
}
