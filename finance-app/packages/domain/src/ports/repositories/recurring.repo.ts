import type { RecurringTransaction } from '../../entities'

/**
 * Port: Recurring transaction repository.
 */
export interface IRecurringRepository {
  findById(id: string): Promise<RecurringTransaction | null>
  findByFinancialSpaceId(financialSpaceId: string): Promise<RecurringTransaction[]>
  findDue(reference: Date): Promise<RecurringTransaction[]>
  create(recurring: RecurringTransaction): Promise<RecurringTransaction>
  update(recurring: RecurringTransaction): Promise<RecurringTransaction>
  delete(id: string): Promise<void>
}
