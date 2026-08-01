import { NotFoundException } from '../../exceptions'
import type { IBudgetRepository } from '../../ports'

export interface DeleteBudgetDeps {
  budgetRepo: IBudgetRepository
}

export function makeDeleteBudget(deps: DeleteBudgetDeps) {
  return async (financialSpaceId: string, budgetId: string): Promise<void> => {
    const budget = await deps.budgetRepo.findById(budgetId)
    if (!budget || budget.financialSpaceId !== financialSpaceId) {
      throw new NotFoundException('Budget')
    }
    await deps.budgetRepo.delete(budgetId)
  }
}
