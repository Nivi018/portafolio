import type { CreateGoalInput } from '@finance/shared'
import { Goal } from '../../entities'
import type { IGoalRepository } from '../../ports'

export interface CreateGoalDeps {
  goalRepo: IGoalRepository
}

export function makeCreateGoal(deps: CreateGoalDeps) {
  return async (financialSpaceId: string, input: CreateGoalInput): Promise<Goal> => {
    const goal = Goal.create({ ...input, financialSpaceId })
    return deps.goalRepo.create(goal)
  }
}
