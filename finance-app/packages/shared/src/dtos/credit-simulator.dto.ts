export interface CreditSimulatorScheduleRowDto {
  month: number
  payment: number
  principal: number
  interest: number
  extraPayment: number
  balance: number
}

export interface CreditSimulatorDto {
  monthlyPayment: number
  totalInterest: number
  totalCost: number
  payoffMonths: number
  schedule: CreditSimulatorScheduleRowDto[]
}
