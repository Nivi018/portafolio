import type { TransferFundsInput } from '@finance/shared'
import { Transaction } from '../../entities'
import { NotFoundException, InsufficientFundsException } from '../../exceptions'
import type { IAccountRepository, ITransactionRepository } from '../../ports'

export interface TransferFundsDeps {
  accountRepo: IAccountRepository
  transactionRepo: ITransactionRepository
}

export interface TransferResult {
  outgoing: Transaction
  incoming: Transaction
}

/**
 * Transfer funds between two accounts of the same user.
 * Creates two linked TRANSFER transactions (audit trail) and updates both balances.
 * Non-credit source accounts must have sufficient funds.
 */
export function makeTransferFunds(deps: TransferFundsDeps) {
  return async (userId: string, input: TransferFundsInput): Promise<TransferResult> => {
    const [from, to] = await Promise.all([
      deps.accountRepo.findById(input.fromAccountId),
      deps.accountRepo.findById(input.toAccountId),
    ])

    if (!from || from.userId !== userId) throw new NotFoundException('Account (origen)')
    if (!to || to.userId !== userId) throw new NotFoundException('Account (destino)')
    if (!from.canWithdraw(input.amount)) throw new InsufficientFundsException(from.name)

    const label = input.description ?? `Transferencia ${from.name} → ${to.name}`

    const outgoing = Transaction.create({
      amount: input.amount,
      description: label,
      type: 'TRANSFER',
      date: input.date,
      accountId: from.id,
      userId,
    })
    const incoming = Transaction.create({
      amount: input.amount,
      description: label,
      type: 'TRANSFER',
      date: input.date,
      accountId: to.id,
      userId,
    })

    from.withdraw(input.amount)
    to.deposit(input.amount)

    await deps.transactionRepo.create(outgoing)
    await deps.transactionRepo.create(incoming)
    await deps.accountRepo.update(from)
    await deps.accountRepo.update(to)

    return { outgoing, incoming }
  }
}
