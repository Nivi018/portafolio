import type { CreatePlanItemInput } from '@finance/shared'
import { PlanItem } from '../../entities'
import { NotFoundException } from '../../exceptions'
import type { IAccountRepository, ICategoryRepository, IPlanItemRepository } from '../../ports'

export interface CreatePlanItemDeps {
  planItemRepo: IPlanItemRepository
  accountRepo: IAccountRepository
  categoryRepo: ICategoryRepository
}

export function makeCreatePlanItem(deps: CreatePlanItemDeps) {
  return async (financialSpaceId: string, input: CreatePlanItemInput): Promise<PlanItem> => {
    if (input.accountId) {
      const account = await deps.accountRepo.findById(input.accountId)
      if (!account || account.financialSpaceId !== financialSpaceId) throw new NotFoundException('Account')
    }
    if (input.categoryId) {
      const category = await deps.categoryRepo.findById(input.categoryId)
      if (!category || category.financialSpaceId !== financialSpaceId) throw new NotFoundException('Category')
    }
    return deps.planItemRepo.create(PlanItem.create({ ...input, financialSpaceId }))
  }
}
