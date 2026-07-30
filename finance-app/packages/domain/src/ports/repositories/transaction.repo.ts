import type { TransactionType } from '@finance/shared'
import type { Transaction } from '../../entities'
import type { DateRange } from '../../value-objects'

export interface TransactionFilters {
  page: number
  limit: number
  type?: TransactionType
  categoryId?: string
  accountId?: string
  from?: Date
  to?: Date
  search?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
}

export interface TransactionSummary {
  totalIncome: number
  totalExpense: number
  netBalance: number
  transactionCount: number
}

export interface CategoryTotal {
  categoryId: string
  categoryName: string
  color: string
  icon: string
  total: number
}

export interface MonthlyFlowPoint {
  month: string // "2026-01"
  income: number
  expense: number
}

/**
 * Port: Transaction repository.
 * Implemented by Prisma adapter in the infrastructure layer.
 */
export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>
  findByUserId(userId: string, filters: TransactionFilters): Promise<PaginatedResult<Transaction>>
  create(transaction: Transaction): Promise<Transaction>
  update(transaction: Transaction): Promise<Transaction>
  delete(id: string): Promise<void>

  getSummary(userId: string, range: DateRange): Promise<TransactionSummary>
  getCategoryTotals(
    userId: string,
    range: DateRange,
    type: TransactionType
  ): Promise<CategoryTotal[]>
  getMonthlyFlow(userId: string, months: number): Promise<MonthlyFlowPoint[]>
  getRecentByUserId(userId: string, limit: number): Promise<Transaction[]>

  /** Total EXPENSE amount in a range, optionally scoped to one category. */
  getTotalSpent(userId: string, range: DateRange, categoryId?: string): Promise<number>
}
