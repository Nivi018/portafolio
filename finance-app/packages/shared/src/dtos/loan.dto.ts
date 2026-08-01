export interface LoanDto {
  id: string
  financialSpaceId: string
  lender: string
  name: string
  originalPrincipal: number
  currentBalance: number
  annualRate: number
  termMonths: number
  monthlyPayment: number
  startDate: string
  nextPaymentDate: string
  createdAt: string
  updatedAt: string
}

export interface LoanWithProgressDto extends LoanDto {
  progressPercentage: number
  estimatedTotalInterest: number
}

export interface LoanPaymentDto {
  id: string
  loanId: string
  amount: number
  date: string
  transactionId: string
  createdAt: string
}
