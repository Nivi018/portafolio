import type { Goal } from '../../entities'

/**
 * Port: Goal repository.
 */
export interface IGoalRepository {
  findById(id: string): Promise<Goal | null>
  findByFinancialSpaceId(financialSpaceId: string): Promise<Goal[]>
  create(goal: Goal): Promise<Goal>
  update(goal: Goal): Promise<Goal>
  delete(id: string): Promise<void>
}
