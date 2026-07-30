import type { CreateGoalInput } from '@finance/shared'
import { Goal } from '../../entities'
import type { IGoalRepository } from '../../ports'

export interface CreateGoalDeps {
  goalRepo: IGoalRepository
}

export function makeCreateGoal(deps: CreateGoalDeps) {
  return async (userId: string, input: CreateGoalInput): Promise<Goal> => {
    const goal = Goal.create({ ...input, userId })
    return deps.goalRepo.create(goal)
  }
}
