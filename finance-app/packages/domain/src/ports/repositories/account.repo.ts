import type { Account } from '../../entities'

/**
 * Port: Account repository.
 */
export interface IAccountRepository {
  findById(id: string): Promise<Account | null>
  findByFinancialSpaceId(financialSpaceId: string): Promise<Account[]>
  create(account: Account): Promise<Account>
  update(account: Account): Promise<Account>
  delete(id: string): Promise<void>
  hasTransactions(id: string): Promise<boolean>
  getTotalBalance(financialSpaceId: string): Promise<number>
}
