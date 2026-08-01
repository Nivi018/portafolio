import type { UpdateTransactionInput } from '@finance/shared'
import { Transaction } from '../../entities'
import { NotFoundException, ValidationException } from '../../exceptions'
import type {
  ITransactionRepository,
  IAccountRepository,
  ICategoryRepository,
} from '../../ports'

export interface UpdateTransactionDeps {
  transactionRepo: ITransactionRepository
  accountRepo: IAccountRepository
  categoryRepo: ICategoryRepository
}

/**
 * Update a transaction. If amount/type/account changed, the balance effects
 * of the old version are reverted and the new version is applied.
 */
export function makeUpdateTransaction(deps: UpdateTransactionDeps) {
  return async (
    financialSpaceId: string,
    transactionId: string,
    input: UpdateTransactionInput
  ): Promise<Transaction> => {
    const existing = await deps.transactionRepo.findById(transactionId)
    if (!existing || existing.financialSpaceId !== financialSpaceId) {
      throw new NotFoundException('Transaction')
    }

    const newAccountId = input.accountId ?? existing.accountId
    const account = await deps.accountRepo.findById(newAccountId)
    if (!account || account.financialSpaceId !== financialSpaceId) {
      throw new NotFoundException('Account')
    }

    const newType = input.type ?? existing.type
    const newCategoryId = input.categoryId ?? existing.categoryId
    if (newCategoryId) {
      const category = await deps.categoryRepo.findById(newCategoryId)
      if (!category || category.financialSpaceId !== financialSpaceId) {
        throw new NotFoundException('Category')
      }
      if (newType !== 'TRANSFER' && category.type !== newType) {
        throw new ValidationException(
          `La categoría "${category.name}" es de tipo ${category.type}, no ${newType}`
        )
      }
    } else if (newType !== 'TRANSFER') {
      throw new ValidationException('La categoría es requerida')
    }

    const updated = Transaction.reconstitute({
      id: existing.id,
      amount: input.amount ?? existing.amount,
      description: input.description !== undefined ? (input.description ?? null) : existing.description,
      type: newType,
      date: input.date ?? existing.date,
      categoryId: newCategoryId,
      accountId: newAccountId,
      financialSpaceId: existing.financialSpaceId,
      recurringId: existing.recurringId,
      createdAt: existing.createdAt,
    })

    if (updated.amount <= 0) {
      throw new ValidationException('El monto debe ser positivo')
    }

    if (existing.accountId === account.id) {
      // One entity instance prevents stale-balance overwrites for same-account edits.
      account.revertTransaction(existing)
      account.applyTransaction(updated)
      await deps.accountRepo.update(account)
    } else {
      const oldAccount = await deps.accountRepo.findById(existing.accountId)
      if (oldAccount) {
        oldAccount.revertTransaction(existing)
        await deps.accountRepo.update(oldAccount)
      }
      account.applyTransaction(updated)
      await deps.accountRepo.update(account)
    }

    return deps.transactionRepo.update(updated)
  }
}
