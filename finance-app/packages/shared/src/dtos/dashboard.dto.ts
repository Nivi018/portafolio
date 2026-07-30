import type { TransactionDto } from './transaction.dto'
import type { BudgetStatusDto } from './budget.dto'

/**
 * Dashboard aggregation DTOs.
 */

export interface DashboardSummaryDto {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  monthlyNet: number
  incomeChangePercent: number | null
  expenseChangePercent: number | null
}

export interface CategoryExpenseDto {
  categoryId: string
  categoryName: string
  color: string
  icon: string
  total: number
  percentage: number
}

export interface MonthlyFlowDto {
  month: string // e.g. "2026-01"
  income: number
  expense: number
}

export interface DashboardDto {
  summary: DashboardSummaryDto
  expensesByCategory: CategoryExpenseDto[]
  monthlyFlow: MonthlyFlowDto[]
  recentTransactions: TransactionDto[]
  budgetStatuses: BudgetStatusDto[]
}
