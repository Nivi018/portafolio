import type { CreditSimulatorDto, CreditSimulatorInput } from '@finance/shared'

const cents = (amount: number) => Math.round(amount * 100)
const amount = (value: number) => value / 100

/** Calculates a loan projection only; it does not read or write any persisted records. */
export function simulateCredit(input: CreditSimulatorInput): CreditSimulatorDto {
  const principal = cents(input.principal)
  const extraPayment = cents(input.monthlyExtraPayment ?? 0)
  const monthlyRate = input.annualRate / 1200
  const regularPayment = monthlyRate === 0
    ? principal / input.termMonths
    : principal * monthlyRate / (1 - (1 + monthlyRate) ** -input.termMonths)
  const monthlyPayment = Math.round(regularPayment)
  const schedule: CreditSimulatorDto['schedule'] = []
  let balance = principal
  let totalInterest = 0

  for (let month = 1; balance > 0; month += 1) {
    const interest = Math.round(balance * monthlyRate)
    const scheduledPrincipal = Math.min(balance, Math.max(0, monthlyPayment - interest))
    if (scheduledPrincipal === 0 && balance > 0) {
      throw new Error('El pago mensual no cubre los intereses')
    }
    const extra = Math.min(balance - scheduledPrincipal, extraPayment)
    const principalPaid = scheduledPrincipal + extra
    const payment = interest + principalPaid
    balance -= principalPaid
    totalInterest += interest
    schedule.push({
      month,
      payment: amount(payment),
      principal: amount(scheduledPrincipal),
      interest: amount(interest),
      extraPayment: amount(extra),
      balance: amount(balance),
    })
  }

  return {
    monthlyPayment: amount(monthlyPayment),
    totalInterest: amount(totalInterest),
    totalCost: amount(principal + totalInterest),
    payoffMonths: schedule.length,
    schedule,
  }
}
