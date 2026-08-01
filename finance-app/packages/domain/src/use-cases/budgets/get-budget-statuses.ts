import type { Budget, BudgetStatus } from '../../entities'
import type { IBudgetRepository, ITransactionRepository } from '../../ports'

export interface GetBudgetStatusesDeps {
  budgetRepo: IBudgetRepository
  transactionRepo: ITransactionRepository
}

export interface BudgetWithStatus {
  budget: Budget
  status: BudgetStatus
}

/**
 * List all budgets with their live status for the current period.
 */
export function makeGetBudgetStatuses(deps: GetBudgetStatusesDeps) {
  return async (financialSpaceId: string): Promise<BudgetWithStatus[]> => {
    const budgets = await deps.budgetRepo.findByFinancialSpaceId(financialSpaceId)

    return Promise.all(
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
  }
}
