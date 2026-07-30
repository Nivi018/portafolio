import type { CreateBudgetInput } from '@finance/shared'
import { Budget } from '../../entities'
import { NotFoundException, ValidationException } from '../../exceptions'
import type { IBudgetRepository, ICategoryRepository } from '../../ports'

export interface CreateBudgetDeps {
  budgetRepo: IBudgetRepository
  categoryRepo: ICategoryRepository
}

export function makeCreateBudget(deps: CreateBudgetDeps) {
  return async (userId: string, input: CreateBudgetInput): Promise<Budget> => {
    if (input.categoryId) {
      const category = await deps.categoryRepo.findById(input.categoryId)
      if (!category || category.userId !== userId) {
        throw new NotFoundException('Category')
      }
      if (category.type !== 'EXPENSE') {
        throw new ValidationException('Solo puedes presupuestar categorías de gasto')
      }
    }

    const budget = Budget.create({ ...input, userId })
    return deps.budgetRepo.create(budget)
  }
}
