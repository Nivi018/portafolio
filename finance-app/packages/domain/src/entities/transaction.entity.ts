import type { TransactionType } from '@finance/shared'
import { ValidationException } from '../exceptions'
import { Money } from '../value-objects'

export interface TransactionProps {
  id: string
  amount: number
  description: string | null
  type: TransactionType
  date: Date
  categoryId: string | null
  accountId: string
  userId: string
  recurringId: string | null
  createdAt: Date
}

export interface CreateTransactionData {
  amount: number
  description?: string | null
  type: TransactionType
  date?: Date
  categoryId?: string | null
  accountId: string
  userId: string
  recurringId?: string | null
}

/**
 * Transaction entity.
 *
 * Business rules:
 * - Amount is always stored positive; `type` conveys direction.
 * - INCOME/EXPENSE transactions require a category; TRANSFER does not.
 * - `signedAmount()` expresses the effect on an account balance.
 */
export class Transaction {
  private constructor(private readonly props: TransactionProps) {}

  static create(data: CreateTransactionData): Transaction {
    const money = Money.of(data.amount)
    if (!money.isPositive()) {
      throw new ValidationException('El monto debe ser positivo')
    }
    if (data.type !== 'TRANSFER' && !data.categoryId) {
      throw new ValidationException('La categoría es requerida')
    }

    return new Transaction({
      id: crypto.randomUUID(),
      amount: money.amount,
      description: data.description ?? null,
      type: data.type,
      date: data.date ?? new Date(),
      categoryId: data.categoryId ?? null,
      accountId: data.accountId,
      userId: data.userId,
      recurringId: data.recurringId ?? null,
      createdAt: new Date(),
    })
  }

  /** Rebuild an entity from persistence without re-running validations. */
  static reconstitute(props: TransactionProps): Transaction {
    return new Transaction(props)
  }

  get id(): string {
    return this.props.id
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
  get date(): Date {
    return this.props.date
  }
  get categoryId(): string | null {
    return this.props.categoryId
  }
  get accountId(): string {
    return this.props.accountId
  }
  get userId(): string {
    return this.props.userId
  }
  get recurringId(): string | null {
    return this.props.recurringId
  }
  get createdAt(): Date {
    return this.props.createdAt
  }

  isIncome(): boolean {
    return this.props.type === 'INCOME'
  }

  isExpense(): boolean {
    return this.props.type === 'EXPENSE'
  }

  isTransfer(): boolean {
    return this.props.type === 'TRANSFER'
  }

  /**
   * Effect of this transaction on its account balance.
   * INCOME adds, EXPENSE subtracts, TRANSFER is handled by the transfer use case.
   */
  signedAmount(): number {
    return this.isExpense() ? -this.props.amount : this.props.amount
  }
}
