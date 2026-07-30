import type { AccountType, Currency } from '@finance/shared'
import { ValidationException } from '../exceptions'
import { Money } from '../value-objects'
import type { Transaction } from './transaction.entity'

export interface AccountProps {
  id: string
  userId: string
  name: string
  type: AccountType
  balance: number
  currency: Currency
  createdAt: Date
  updatedAt: Date
}

export interface CreateAccountData {
  name: string
  type: AccountType
  balance?: number
  currency: Currency
  userId: string
}

/**
 * FinanceAccount entity (bank account, wallet, credit card).
 *
 * Business rules:
 * - Balance is a derived number updated transactionally by use cases.
 * - CREDIT accounts may go negative freely; other types can be checked
 *   with `canWithdraw` (used by the transfer use case).
 */
export class Account {
  private constructor(private props: AccountProps) {}

  static create(data: CreateAccountData): Account {
    if (!data.name.trim()) {
      throw new ValidationException('El nombre de la cuenta es requerido')
    }
    const now = new Date()
    return new Account({
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name.trim(),
      type: data.type,
      balance: Money.of(data.balance ?? 0).amount,
      currency: data.currency,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: AccountProps): Account {
    return new Account(props)
  }

  get id(): string {
    return this.props.id
  }
  get userId(): string {
    return this.props.userId
  }
  get name(): string {
    return this.props.name
  }
  get type(): AccountType {
    return this.props.type
  }
  get balance(): number {
    return this.props.balance
  }
  get currency(): Currency {
    return this.props.currency
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  isCredit(): boolean {
    return this.props.type === 'CREDIT'
  }

  canWithdraw(amount: number): boolean {
    if (this.isCredit()) return true
    return Money.of(this.props.balance - amount).isNegative() === false
  }

  deposit(amount: number): void {
    const money = Money.of(amount)
    if (!money.isPositive()) throw new ValidationException('El depósito debe ser positivo')
    this.props.balance = Money.of(this.props.balance).add(money).amount
    this.touch()
  }

  withdraw(amount: number): void {
    const money = Money.of(amount)
    if (!money.isPositive()) throw new ValidationException('El retiro debe ser positivo')
    this.props.balance = Money.of(this.props.balance).subtract(money).amount
    this.touch()
  }

  /** Apply a transaction's effect to the balance. */
  applyTransaction(tx: Transaction): void {
    if (tx.isExpense()) this.withdraw(tx.amount)
    else this.deposit(tx.amount)
  }

  /** Revert a transaction's effect (used when deleting or editing). */
  revertTransaction(tx: Transaction): void {
    if (tx.isExpense()) this.deposit(tx.amount)
    else this.withdraw(tx.amount)
  }

  rename(name: string): void {
    if (!name.trim()) throw new ValidationException('El nombre de la cuenta es requerido')
    this.props.name = name.trim()
    this.touch()
  }

  changeType(type: AccountType): void {
    this.props.type = type
    this.touch()
  }

  changeCurrency(currency: Currency): void {
    this.props.currency = currency
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }
}
