import type { RecordLoanPaymentInput } from '@finance/shared'
import { Loan, LoanPayment, Transaction } from '../../entities'
import { NotFoundException, ValidationException } from '../../exceptions'
import type {
  IAccountRepository,
  ICategoryRepository,
  ILoanRepository,
  ITransactionRepository,
} from '../../ports'

export interface RecordLoanPaymentDeps {
  loanRepo: ILoanRepository
  transactionRepo: ITransactionRepository
  accountRepo: IAccountRepository
  categoryRepo: ICategoryRepository
}

export interface RecordLoanPaymentResult {
  loan: Loan
  payment: LoanPayment
  transaction: Transaction
}

export function makeRecordLoanPayment(deps: RecordLoanPaymentDeps) {
  return async (
    financialSpaceId: string,
    loanId: string,
    input: RecordLoanPaymentInput
  ): Promise<RecordLoanPaymentResult> => {
    const loan = await deps.loanRepo.findById(loanId)
    if (!loan || loan.financialSpaceId !== financialSpaceId) throw new NotFoundException('Loan')

    const account = await deps.accountRepo.findById(input.accountId)
    if (!account || account.financialSpaceId !== financialSpaceId) throw new NotFoundException('Account')

    const category = await deps.categoryRepo.findById(input.categoryId)
    if (!category || category.financialSpaceId !== financialSpaceId) throw new NotFoundException('Category')
    if (category.type !== 'EXPENSE') {
      throw new ValidationException(`La categoría "${category.name}" debe ser de tipo EXPENSE`)
    }
    if (!(input.date instanceof Date) || Number.isNaN(input.date.getTime())) {
      throw new ValidationException('La fecha de pago no es válida')
    }

    // Validate the amount against the outstanding balance before persisting any related record.
    loan.recordPayment(input.amount)
    const transaction = Transaction.create({
      amount: input.amount,
      description: `Pago de préstamo: ${loan.name}`,
      type: 'EXPENSE',
      date: input.date,
      categoryId: category.id,
      accountId: account.id,
      financialSpaceId,
    })
    const payment = LoanPayment.create({
      loanId: loan.id,
      amount: input.amount,
      date: input.date,
      transactionId: transaction.id,
    })
    account.applyTransaction(transaction)

    await deps.transactionRepo.create(transaction)
    await deps.accountRepo.update(account)
    await deps.loanRepo.update(loan)
    await deps.loanRepo.createPayment(payment)

    return { loan, payment, transaction }
  }
}
