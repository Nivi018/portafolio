import type { BudgetPeriod } from '../types/enums'
import type { CategorySummaryDto } from './category.dto'

/**
 * Budget DTOs.
 */

export interface BudgetDto {
  id: string
  amount: number
  period: BudgetPeriod
  startDate: string
  category: CategorySummaryDto | null
  createdAt: string
}

export interface BudgetStatusDto extends BudgetDto {
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}
