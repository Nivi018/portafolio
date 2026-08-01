import type {
  Transaction,
  Budget,
  BudgetStatus,
} from '../../entities'
import { DateRange } from '../../value-objects'
import type {
  IAccountRepository,
  ITransactionRepository,
  IBudgetRepository,
  TransactionSummary,
  CategoryTotal,
  MonthlyFlowPoint,
} from '../../ports'

export interface GetDashboardDeps {
  accountRepo: IAccountRepository
  transactionRepo: ITransactionRepository
  budgetRepo: IBudgetRepository
}

export interface DashboardData {
  totalBalance: number
  summary: TransactionSummary
  incomeChangePercent: number | null
  expenseChangePercent: number | null
  expensesByCategory: Array<CategoryTotal & { percentage: number }>
  monthlyFlow: MonthlyFlowPoint[]
  recentTransactions: Transaction[]
  budgetStatuses: Array<{ budget: Budget; status: BudgetStatus }>
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 10000) / 100
}

/**
 * Aggregate all dashboard data in one orchestrated call:
 * totals, month-over-month changes, category breakdown,
 * monthly flow, recent activity, and budget statuses.
 */
export function makeGetDashboard(deps: GetDashboardDeps) {
  return async (financialSpaceId: string): Promise<DashboardData> => {
    const currentRange = DateRange.currentMonth()
    const previousRange = DateRange.previousMonth()

    const [totalBalance, summary, previousSummary, categoryTotals, monthlyFlow, recent, budgets] =
      await Promise.all([
        deps.accountRepo.getTotalBalance(financialSpaceId),
        deps.transactionRepo.getSummary(financialSpaceId, currentRange),
        deps.transactionRepo.getSummary(financialSpaceId, previousRange),
        deps.transactionRepo.getCategoryTotals(financialSpaceId, currentRange, 'EXPENSE'),
        deps.transactionRepo.getMonthlyFlow(financialSpaceId, 6),
        deps.transactionRepo.getRecentByFinancialSpaceId(financialSpaceId, 5),
        deps.budgetRepo.findByFinancialSpaceId(financialSpaceId),
      ])

    const totalExpense = categoryTotals.reduce((acc, c) => acc + c.total, 0)
    const expensesByCategory = categoryTotals.map((c) => ({
      ...c,
      percentage:
        totalExpense > 0 ? Math.round((c.total / totalExpense) * 10000) / 100 : 0,
    }))

    const budgetStatuses = await Promise.all(
      budgets.map(async (budget) => {
        const range = budget.getCurrentRange()
        const spent = await deps.transactionRepo.getTotalSpent(
          financialSpaceId,
          range,
          budget.categoryId ?? undefined
        )
        return { budget, status: budget.computeStatus(spent) }
      })
    )

    return {
      totalBalance,
      summary,
      incomeChangePercent: changePercent(summary.totalIncome, previousSummary.totalIncome),
      expenseChangePercent: changePercent(summary.totalExpense, previousSummary.totalExpense),
      expensesByCategory,
      monthlyFlow,
      recentTransactions: recent,
      budgetStatuses,
    }
  }
}
