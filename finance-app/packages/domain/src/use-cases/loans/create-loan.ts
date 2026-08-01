import type { CreateLoanInput } from '@finance/shared'
import { Loan } from '../../entities'
import type { ILoanRepository } from '../../ports'

export interface CreateLoanDeps {
  loanRepo: ILoanRepository
}

export function makeCreateLoan(deps: CreateLoanDeps) {
  return async (financialSpaceId: string, input: CreateLoanInput): Promise<Loan> => {
    const loan = Loan.create({ ...input, financialSpaceId })
    return deps.loanRepo.create(loan)
  }
}
