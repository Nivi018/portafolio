import type { UpdateBudgetInput } from '@finance/shared'
import type { Budget } from '../../entities'
import { NotFoundException } from '../../exceptions'
import type { IBudgetRepository } from '../../ports'

export interface UpdateBudgetDeps {
  budgetRepo: IBudgetRepository
}

export function makeUpdateBudget(deps: UpdateBudgetDeps) {
  return async (
    financialSpaceId: string,
    budgetId: string,
    input: UpdateBudgetInput
  ): Promise<Budget> => {
    const budget = await deps.budgetRepo.findById(budgetId)
    if (!budget || budget.financialSpaceId !== financialSpaceId) {
      throw new NotFoundException('Budget')
    }

    if (input.amount !== undefined) budget.changeAmount(input.amount)
    if (input.period !== undefined) budget.changePeriod(input.period)

    return deps.budgetRepo.update(budget)
  }
}
