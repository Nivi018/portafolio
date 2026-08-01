import type { RecurrenceFrequency, TransactionType } from '@finance/shared'
import { ValidationException } from '../exceptions'
import { Money } from '../value-objects'

export interface RecurringTransactionProps {
  id: string
  financialSpaceId: string
  amount: number
  description: string | null
  type: TransactionType
  frequency: RecurrenceFrequency
  nextDueDate: Date
  categoryId: string
  accountId: string
  active: boolean
  createdAt: Date
}

export interface CreateRecurringData {
  amount: number
  description?: string | null
  type: TransactionType
  frequency: RecurrenceFrequency
  nextDueDate: Date
  categoryId: string
  accountId: string
  financialSpaceId: string
}

/**
 * Recurring transaction template.
 * When processed, generates a real Transaction and advances nextDueDate.
 */
export class RecurringTransaction {
  private constructor(private props: RecurringTransactionProps) {}

  static create(data: CreateRecurringData): RecurringTransaction {
    const money = Money.of(data.amount)
    if (!money.isPositive()) {
      throw new ValidationException('El monto debe ser positivo')
    }
    if (data.type === 'TRANSFER') {
      throw new ValidationException('Las transferencias no pueden ser recurrentes')
    }
    return new RecurringTransaction({
      id: crypto.randomUUID(),
      financialSpaceId: data.financialSpaceId,
      amount: money.amount,
      description: data.description ?? null,
      type: data.type,
      frequency: data.frequency,
      nextDueDate: data.nextDueDate,
      categoryId: data.categoryId,
      accountId: data.accountId,
      active: true,
      createdAt: new Date(),
    })
  }

  static reconstitute(props: RecurringTransactionProps): RecurringTransaction {
    return new RecurringTransaction(props)
  }

  get id(): string {
    return this.props.id
  }
  get financialSpaceId(): string {
    return this.props.financialSpaceId
  }
  get amount(): number {
    return this.props.amount
  }
  get description(): string | null {
    return this.props.description
  }
  get type(): TransactionType {
    return this.props.type
  }
  get frequency(): RecurrenceFrequency {
    return this.props.frequency
  }
  get nextDueDate(): Date {
    return this.props.nextDueDate
  }
  get categoryId(): string {
    return this.props.categoryId
  }
  get accountId(): string {
    return this.props.accountId
  }
  get active(): boolean {
    return this.props.active
  }
  get createdAt(): Date {
    return this.props.createdAt
  }

  isDue(reference: Date = new Date()): boolean {
    return this.props.active && this.props.nextDueDate <= reference
  }

  /** Advance nextDueDate by one frequency step (keeps schedule even if overdue). */
  advance(): void {
    this.props.nextDueDate = this.computeNext(this.props.nextDueDate)
  }

  computeNext(from: Date): Date {
    const next = new Date(from)
    switch (this.props.frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + 1)
        break
      case 'WEEKLY':
        next.setDate(next.getDate() + 7)
        break
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1)
        break
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1)
        break
    }
    return next
  }

  deactivate(): void {
    this.props.active = false
  }

  activate(): void {
    this.props.active = true
  }
}
