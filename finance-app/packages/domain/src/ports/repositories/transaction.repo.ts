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

/** Actual transactions aggregated by calendar month, type, and category. */
export interface MonthlyCategoryTotal {
  month: string // "2026-01"
  type: TransactionType
  categoryId: string | null
  total: number
}

/**
 * Port: Transaction repository.
 * Implemented by Prisma adapter in the infrastructure layer.
 */
export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>
  findByFinancialSpaceId(
    financialSpaceId: string,
    filters: TransactionFilters
  ): Promise<PaginatedResult<Transaction>>
  create(transaction: Transaction): Promise<Transaction>
  update(transaction: Transaction): Promise<Transaction>
  delete(id: string): Promise<void>

  getSummary(financialSpaceId: string, range: DateRange): Promise<TransactionSummary>
  getCategoryTotals(
    financialSpaceId: string,
    range: DateRange,
    type: TransactionType
  ): Promise<CategoryTotal[]>
  getMonthlyCategoryTotals(
    financialSpaceId: string,
    range: DateRange
  ): Promise<MonthlyCategoryTotal[]>
  getMonthlyFlow(financialSpaceId: string, months: number): Promise<MonthlyFlowPoint[]>
  getRecentByFinancialSpaceId(financialSpaceId: string, limit: number): Promise<Transaction[]>

  /** Total EXPENSE amount in a range, optionally scoped to one category. */
  getTotalSpent(financialSpaceId: string, range: DateRange, categoryId?: string): Promise<number>
}
