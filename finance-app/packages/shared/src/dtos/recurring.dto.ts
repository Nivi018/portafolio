import type { RecurrenceFrequency, TransactionType } from '../types/enums'
import type { CategorySummaryDto } from './category.dto'
import type { AccountSummaryDto } from './account.dto'

/**
 * Recurring transaction DTOs.
 */

export interface RecurringTransactionDto {
  id: string
  amount: number
  description: string | null
  type: TransactionType
  frequency: RecurrenceFrequency
  nextDueDate: string
  active: boolean
  category: CategorySummaryDto
  account: AccountSummaryDto
  createdAt: string
}
