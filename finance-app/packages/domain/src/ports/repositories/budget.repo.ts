import type { Budget } from '../../entities'

/**
 * Port: Budget repository.
 */
export interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>
  findByFinancialSpaceId(financialSpaceId: string): Promise<Budget[]>
  create(budget: Budget): Promise<Budget>
  update(budget: Budget): Promise<Budget>
  delete(id: string): Promise<void>
}
