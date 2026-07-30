import type { CreateRecurringInput } from '@finance/shared'
import { RecurringTransaction } from '../../entities'
import { NotFoundException } from '../../exceptions'
import type { IRecurringRepository, IAccountRepository, ICategoryRepository } from '../../ports'

export interface CreateRecurringDeps {
  recurringRepo: IRecurringRepository
  accountRepo: IAccountRepository
  categoryRepo: ICategoryRepository
}

export function makeCreateRecurring(deps: CreateRecurringDeps) {
  return async (userId: string, input: CreateRecurringInput): Promise<RecurringTransaction> => {
    const account = await deps.accountRepo.findById(input.accountId)
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Account')
    }

    const category = await deps.categoryRepo.findById(input.categoryId)
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category')
    }

    const recurring = RecurringTransaction.create({ ...input, userId })
    return deps.recurringRepo.create(recurring)
  }
}
