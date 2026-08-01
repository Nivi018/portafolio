import type { UpdateGoalInput } from '@finance/shared'
import { NotFoundException } from '../../exceptions'
import type { IGoalRepository } from '../../ports'
import type { Goal } from '../../entities'

export interface UpdateGoalDeps {
  goalRepo: IGoalRepository
}

export function makeUpdateGoal(deps: UpdateGoalDeps) {
  return async (financialSpaceId: string, goalId: string, input: UpdateGoalInput): Promise<Goal> => {
    const goal = await deps.goalRepo.findById(goalId)
    if (!goal || goal.financialSpaceId !== financialSpaceId) throw new NotFoundException('Goal')

    if (input.name !== undefined) goal.rename(input.name)
    if (input.targetAmount !== undefined) goal.changeTarget(input.targetAmount)
    if (input.deadline !== undefined) goal.changeDeadline(input.deadline)
    if (input.expectedAnnualReturn !== undefined) goal.changeExpectedAnnualReturn(input.expectedAnnualReturn)
    if (input.monthlyContributionTarget !== undefined) {
      goal.changeMonthlyContributionTarget(input.monthlyContributionTarget)
    }
    return deps.goalRepo.update(goal)
  }
}
