import { Transaction } from '../../entities'
import type {
  IRecurringRepository,
  ITransactionRepository,
  IAccountRepository,
} from '../../ports'

export interface ProcessDueRecurringDeps {
  recurringRepo: IRecurringRepository
  transactionRepo: ITransactionRepository
  accountRepo: IAccountRepository
}

export interface ProcessDueResult {
  processed: number
  failed: number
}

/**
 * Process all due recurring transactions (called by a scheduled endpoint/cron).
 * For each due item: creates the real transaction, updates the account balance,
 * and advances the schedule. Catches up if multiple periods were missed.
 */
export function makeProcessDueRecurring(deps: ProcessDueRecurringDeps) {
  return async (reference: Date = new Date()): Promise<ProcessDueResult> => {
    const dueItems = await deps.recurringRepo.findDue(reference)
    const result: ProcessDueResult = { processed: 0, failed: 0 }

    for (const recurring of dueItems) {
      try {
        const account = await deps.accountRepo.findById(recurring.accountId)
        if (!account) {
          result.failed++
          continue
        }

        // Catch up on every missed occurrence, not just the latest one
        while (recurring.isDue(reference)) {
          const transaction = Transaction.create({
            amount: recurring.amount,
            description: recurring.description,
            type: recurring.type,
            date: recurring.nextDueDate,
            categoryId: recurring.categoryId,
            accountId: recurring.accountId,
            userId: recurring.userId,
            recurringId: recurring.id,
          })

          account.applyTransaction(transaction)
          await deps.transactionRepo.create(transaction)
          recurring.advance()
          result.processed++
        }

        await deps.accountRepo.update(account)
        await deps.recurringRepo.update(recurring)
      } catch {
        result.failed++
      }
    }

    return result
  }
}
