import { NotFoundException } from '../../exceptions'
import type { Loan } from '../../entities'
import type { ILoanRepository } from '../../ports'

export interface GetLoanDeps {
  loanRepo: ILoanRepository
}

export function makeGetLoan(deps: GetLoanDeps) {
  return async (financialSpaceId: string, loanId: string): Promise<Loan> => {
    const loan = await deps.loanRepo.findById(loanId)
    if (!loan || loan.financialSpaceId !== financialSpaceId) throw new NotFoundException('Loan')
    return loan
  }
}
