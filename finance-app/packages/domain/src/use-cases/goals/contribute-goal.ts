import type { ContributeGoalInput } from '@finance/shared'
import { Transaction, Goal } from '../../entities'
import { NotFoundException, InsufficientFundsException } from '../../exceptions'
import type { IGoalRepository, IAccountRepository, ITransactionRepository } from '../../ports'

export interface ContributeGoalDeps {
  goalRepo: IGoalRepository
  accountRepo: IAccountRepository
  transactionRepo: ITransactionRepository
}

export interface ContributeGoalResult {
  goal: Goal
  transaction: Transaction
}

/**
 * Contribute to a savings goal.
 * Withdraws from the chosen account (recorded as a TRANSFER transaction)
 * and increments the goal's current amount. Transfers do not require a
 * spending category.
 */
export function makeContributeGoal(deps: ContributeGoalDeps) {
  return async (
    financialSpaceId: string,
    goalId: string,
    input: ContributeGoalInput
  ): Promise<ContributeGoalResult> => {
    const goal = await deps.goalRepo.findById(goalId)
    if (!goal || goal.financialSpaceId !== financialSpaceId) {
      throw new NotFoundException('Goal')
    }

    const account = await deps.accountRepo.findById(input.accountId)
    if (!account || account.financialSpaceId !== financialSpaceId) {
      throw new NotFoundException('Account')
    }
    if (!account.canWithdraw(input.amount)) {
      throw new InsufficientFundsException(account.name)
    }

    goal.contribute(input.amount)
    account.withdraw(input.amount)

    const transaction = Transaction.create({
      amount: input.amount,
      description: `Aportación a meta: ${goal.name}`,
      type: 'TRANSFER',
      date: new Date(),
      categoryId: null,
      accountId: account.id,
      financialSpaceId,
    })

    await deps.transactionRepo.create(transaction)
    await deps.goalRepo.update(goal)
    await deps.accountRepo.update(account)

    return { goal, transaction }
  }
}
