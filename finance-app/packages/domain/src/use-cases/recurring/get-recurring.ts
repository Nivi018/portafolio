import type { RecurringTransaction } from '../../entities'
import type { IRecurringRepository } from '../../ports'

export interface GetRecurringDeps {
  recurringRepo: IRecurringRepository
}

export function makeGetRecurring(deps: GetRecurringDeps) {
  return async (userId: string): Promise<RecurringTransaction[]> => {
    return deps.recurringRepo.findByUserId(userId)
  }
}
