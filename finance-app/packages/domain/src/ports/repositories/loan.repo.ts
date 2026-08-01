import type { Loan, LoanPayment } from '../../entities'

export interface ILoanRepository {
  findById(id: string): Promise<Loan | null>
  findByFinancialSpaceId(financialSpaceId: string): Promise<Loan[]>
  findPaymentsByLoanId(loanId: string): Promise<LoanPayment[]>
  create(loan: Loan): Promise<Loan>
  update(loan: Loan): Promise<Loan>
  createPayment(payment: LoanPayment): Promise<LoanPayment>
}
