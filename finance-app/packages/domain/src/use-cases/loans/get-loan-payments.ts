import { NotFoundException } from '../../exceptions'
import type { LoanPayment } from '../../entities'
import type { ILoanRepository } from '../../ports'

export interface GetLoanPaymentsDeps {
  loanRepo: ILoanRepository
}

export function makeGetLoanPayments(deps: GetLoanPaymentsDeps) {
  return async (financialSpaceId: string, loanId: string): Promise<LoanPayment[]> => {
    const loan = await deps.loanRepo.findById(loanId)
    if (!loan || loan.financialSpaceId !== financialSpaceId) throw new NotFoundException('Loan')
    return deps.loanRepo.findPaymentsByLoanId(loanId)
  }
}
