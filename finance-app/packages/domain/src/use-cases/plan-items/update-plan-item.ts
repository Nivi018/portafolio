import type { UpdatePlanItemInput } from '@finance/shared'
import type { PlanItem } from '../../entities'
import { NotFoundException } from '../../exceptions'
import type { IAccountRepository, ICategoryRepository, IPlanItemRepository } from '../../ports'

export interface UpdatePlanItemDeps {
  planItemRepo: IPlanItemRepository
  accountRepo: IAccountRepository
  categoryRepo: ICategoryRepository
}

export function makeUpdatePlanItem(deps: UpdatePlanItemDeps) {
  return async (
    financialSpaceId: string,
    planItemId: string,
    input: UpdatePlanItemInput
  ): Promise<PlanItem> => {
    const planItem = await deps.planItemRepo.findById(planItemId)
    if (!planItem || planItem.financialSpaceId !== financialSpaceId) throw new NotFoundException('PlanItem')
    if (input.accountId) {
      const account = await deps.accountRepo.findById(input.accountId)
      if (!account || account.financialSpaceId !== financialSpaceId) throw new NotFoundException('Account')
    }
    if (input.categoryId) {
      const category = await deps.categoryRepo.findById(input.categoryId)
      if (!category || category.financialSpaceId !== financialSpaceId) throw new NotFoundException('Category')
    }
    planItem.update(input)
    return deps.planItemRepo.update(planItem)
  }
}
