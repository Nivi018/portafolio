import type { TransactionType } from '../types/enums'
import type { CategorySummaryDto } from './category.dto'
import type { AccountSummaryDto } from './account.dto'

/**
 * Transaction DTOs.
 */

export interface TransactionDto {
  id: string
  amount: number
  description: string | null
  type: TransactionType
  date: string
  // Transfers do not belong to an income/expense category.
  category: CategorySummaryDto | null
  account: AccountSummaryDto
  createdAt: string
}

export interface TransactionSummaryDto {
  totalIncome: number
  totalExpense: number
  netBalance: number
  transactionCount: number
}

export interface ImportCsvResultDto {
  imported: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}
