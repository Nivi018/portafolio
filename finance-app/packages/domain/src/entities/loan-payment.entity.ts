import { ValidationException } from '../exceptions'
import { Money } from '../value-objects'

export interface LoanPaymentProps {
  id: string
  loanId: string
  amount: number
  date: Date
  transactionId: string
  createdAt: Date
}

export interface CreateLoanPaymentData {
  loanId: string
  amount: number
  date: Date
  transactionId: string
}

export class LoanPayment {
  private constructor(private readonly props: LoanPaymentProps) {}

  static create(data: CreateLoanPaymentData): LoanPayment {
    const amount = Money.of(data.amount)
    if (!amount.isPositive()) throw new ValidationException('El pago debe ser positivo')
    if (!(data.date instanceof Date) || Number.isNaN(data.date.getTime())) {
      throw new ValidationException('La fecha de pago no es válida')
    }

    return new LoanPayment({
      id: crypto.randomUUID(),
      loanId: data.loanId,
      amount: amount.amount,
      date: data.date,
      transactionId: data.transactionId,
      createdAt: new Date(),
    })
  }

  static reconstitute(props: LoanPaymentProps): LoanPayment {
    return new LoanPayment(props)
  }

  get id() { return this.props.id }
  get loanId() { return this.props.loanId }
  get amount() { return this.props.amount }
  get date() { return this.props.date }
  get transactionId() { return this.props.transactionId }
  get createdAt() { return this.props.createdAt }
}
