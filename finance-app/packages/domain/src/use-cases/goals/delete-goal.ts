import { NotFoundException } from '../../exceptions'
import type { IGoalRepository } from '../../ports'

export interface DeleteGoalDeps {
  goalRepo: IGoalRepository
}

export function makeDeleteGoal(deps: DeleteGoalDeps) {
  return async (userId: string, goalId: string): Promise<void> => {
    const goal = await deps.goalRepo.findById(goalId)
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException('Goal')
    }
    await deps.goalRepo.delete(goalId)
  }
}
