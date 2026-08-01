import { ValidationException } from '../exceptions'
import { Money } from '../value-objects'

export interface LoanProps {
  id: string
  financialSpaceId: string
  lender: string
  name: string
  originalPrincipal: number
  currentBalance: number
  annualRate: number
  termMonths: number
  monthlyPayment: number
  startDate: Date
  nextPaymentDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateLoanData {
  financialSpaceId: string
  lender: string
  name: string
  originalPrincipal: number
  annualRate: number
  termMonths: number
  monthlyPayment: number
  startDate: Date
  nextPaymentDate: Date
}

export class Loan {
  private constructor(private props: LoanProps) {}

  static create(data: CreateLoanData): Loan {
    if (!data.lender.trim()) throw new ValidationException('El prestamista es requerido')
    if (!data.name.trim()) throw new ValidationException('El nombre del préstamo es requerido')

    const principal = Money.of(data.originalPrincipal)
    if (!principal.isPositive()) throw new ValidationException('El capital original debe ser positivo')

    const monthlyPayment = Money.of(data.monthlyPayment)
    if (!monthlyPayment.isPositive()) throw new ValidationException('El pago mensual debe ser positivo')

    if (!Number.isFinite(data.annualRate) || data.annualRate < 0) {
      throw new ValidationException('La tasa anual debe ser un número no negativo')
    }
    if (!Number.isInteger(data.termMonths) || data.termMonths <= 0) {
      throw new ValidationException('El plazo debe ser un número entero positivo de meses')
    }
    if (!isValidDate(data.startDate) || !isValidDate(data.nextPaymentDate)) {
      throw new ValidationException('Las fechas del préstamo no son válidas')
    }
    if (data.nextPaymentDate < data.startDate) {
      throw new ValidationException('La próxima fecha de pago no puede ser anterior a la fecha de inicio')
    }

    const now = new Date()
    return new Loan({
      id: crypto.randomUUID(),
      financialSpaceId: data.financialSpaceId,
      lender: data.lender.trim(),
      name: data.name.trim(),
      originalPrincipal: principal.amount,
      currentBalance: principal.amount,
      annualRate: data.annualRate,
      termMonths: data.termMonths,
      monthlyPayment: monthlyPayment.amount,
      startDate: data.startDate,
      nextPaymentDate: data.nextPaymentDate,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: LoanProps): Loan {
    return new Loan(props)
  }

  get id() { return this.props.id }
  get financialSpaceId() { return this.props.financialSpaceId }
  get lender() { return this.props.lender }
  get name() { return this.props.name }
  get originalPrincipal() { return this.props.originalPrincipal }
  get currentBalance() { return this.props.currentBalance }
  get annualRate() { return this.props.annualRate }
  get termMonths() { return this.props.termMonths }
  get monthlyPayment() { return this.props.monthlyPayment }
  get startDate() { return this.props.startDate }
  get nextPaymentDate() { return this.props.nextPaymentDate }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  getProgress(): number {
    return Math.min(
      Math.max(Math.round(((this.props.originalPrincipal - this.props.currentBalance) / this.props.originalPrincipal) * 10000) / 100, 0),
      100
    )
  }

  getEstimatedTotalInterest(): number {
    return Money.of(this.props.monthlyPayment * this.props.termMonths - this.props.originalPrincipal).amount
  }

  recordPayment(amount: number): void {
    const payment = Money.of(amount)
    if (!payment.isPositive()) throw new ValidationException('El pago debe ser positivo')
    if (payment.isGreaterThan(Money.of(this.props.currentBalance))) {
      throw new ValidationException('El pago no puede exceder el saldo actual')
    }

    this.props.currentBalance = Money.of(this.props.currentBalance).subtract(payment).amount
    this.props.nextPaymentDate = addOneMonth(this.props.nextPaymentDate)
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }
}

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

function addOneMonth(date: Date): Date {
  const nextDate = new Date(date)
  const day = nextDate.getDate()
  nextDate.setDate(1)
  nextDate.setMonth(nextDate.getMonth() + 1)
  const lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
  nextDate.setDate(Math.min(day, lastDay))
  return nextDate
}
