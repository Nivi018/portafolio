import { NotFoundException } from '../../exceptions'
import type { IBudgetRepository } from '../../ports'

export interface DeleteBudgetDeps {
  budgetRepo: IBudgetRepository
}

export function makeDeleteBudget(deps: DeleteBudgetDeps) {
  return async (userId: string, budgetId: string): Promise<void> => {
    const budget = await deps.budgetRepo.findById(budgetId)
    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget')
    }
    await deps.budgetRepo.delete(budgetId)
  }
}
