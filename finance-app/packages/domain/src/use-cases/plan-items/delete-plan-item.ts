import { NotFoundException } from '../../exceptions'
import type { IPlanItemRepository } from '../../ports'

export function makeDeletePlanItem(deps: { planItemRepo: IPlanItemRepository }) {
  return async (financialSpaceId: string, planItemId: string): Promise<void> => {
    const planItem = await deps.planItemRepo.findById(planItemId)
    if (!planItem || planItem.financialSpaceId !== financialSpaceId) throw new NotFoundException('PlanItem')
    await deps.planItemRepo.delete(planItemId)
  }
}
