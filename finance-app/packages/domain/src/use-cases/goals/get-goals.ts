import type { Goal } from '../../entities'
import type { IGoalRepository } from '../../ports'

export interface GetGoalsDeps {
  goalRepo: IGoalRepository
}

export function makeGetGoals(deps: GetGoalsDeps) {
  return async (financialSpaceId: string): Promise<Goal[]> => {
    return deps.goalRepo.findByFinancialSpaceId(financialSpaceId)
  }
}
