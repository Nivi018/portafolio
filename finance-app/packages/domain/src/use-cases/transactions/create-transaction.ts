import type { CreateTransactionInput } from '@finance/shared'
import { Transaction } from '../../entities'
import { NotFoundException, ValidationException } from '../../exceptions'
import type {
  ITransactionRepository,
  IAccountRepository,
  ICategoryRepository,
} from '../../ports'

export interface CreateTransactionDeps {
  transactionRepo: ITransactionRepository
  accountRepo: IAccountRepository
  categoryRepo: ICategoryRepository
}

/**
 * Create a transaction and update the account balance atomically.
 * Validates ownership of both account and category.
 */
export function makeCreateTransaction(deps: CreateTransactionDeps) {
  return async (userId: string, input: CreateTransactionInput): Promise<Transaction> => {
    const account = await deps.accountRepo.findById(input.accountId)
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Account')
    }

    const category = await deps.categoryRepo.findById(input.categoryId)
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category')
    }
    if (category.type !== input.type) {
      throw new ValidationException(
        `La categoría "${category.name}" es de tipo ${category.type}, no ${input.type}`
      )
    }

    const transaction = Transaction.create({ ...input, userId })
    account.applyTransaction(transaction)

    await deps.transactionRepo.create(transaction)
    await deps.accountRepo.update(account)

    return transaction
  }
}
