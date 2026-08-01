import type { Loan } from '../../entities'
import type { ILoanRepository } from '../../ports'

export interface GetLoansDeps {
  loanRepo: ILoanRepository
}

export function makeGetLoans(deps: GetLoansDeps) {
  return async (financialSpaceId: string): Promise<Loan[]> => {
    return deps.loanRepo.findByFinancialSpaceId(financialSpaceId)
  }
}
