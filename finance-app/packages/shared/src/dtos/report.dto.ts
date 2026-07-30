import type { CategoryExpenseDto, MonthlyFlowDto } from './dashboard.dto'

/**
 * Report DTOs for the reports module.
 */

export interface ReportFiltersDto {
  from: string
  to: string
  accountId?: string
}

export interface IncomeExpenseReportDto {
  period: { from: string; to: string }
  totalIncome: number
  totalExpense: number
  netBalance: number
  monthlyFlow: MonthlyFlowDto[]
  expensesByCategory: CategoryExpenseDto[]
  incomeByCategory: CategoryExpenseDto[]
}

export interface AccountReportDto {
  accountId: string
  accountName: string
  openingBalance: number
  closingBalance: number
  totalIncome: number
  totalExpense: number
  transactionCount: number
}
