import type { PlanItem } from '../../entities'
import type { IPlanItemRepository } from '../../ports'

export function makeGetPlanItems(deps: { planItemRepo: IPlanItemRepository }) {
  return async (financialSpaceId: string): Promise<PlanItem[]> =>
    deps.planItemRepo.findByFinancialSpaceId(financialSpaceId)
}
