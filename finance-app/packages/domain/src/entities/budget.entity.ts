import type { BudgetPeriod } from '@finance/shared'
import { ValidationException } from '../exceptions'
import { Money, DateRange, getBudgetPeriodRange } from '../value-objects'

export interface BudgetProps {
  id: string
  financialSpaceId: string
  amount: number
  period: BudgetPeriod
  categoryId: string | null
  startDate: Date
  createdAt: Date
}

export interface CreateBudgetData {
  amount: number
  period: BudgetPeriod
  categoryId?: string | null
  startDate?: Date
  financialSpaceId: string
}

export interface BudgetStatus {
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

/**
 * Budget entity.
 * A budget without categoryId applies to total expenses (global budget).
 */
export class Budget {
  private constructor(private props: BudgetProps) {}

  static create(data: CreateBudgetData): Budget {
    const money = Money.of(data.amount)
    if (!money.isPositive()) {
      throw new ValidationException('El monto del presupuesto debe ser positivo')
    }
    return new Budget({
      id: crypto.randomUUID(),
      financialSpaceId: data.financialSpaceId,
      amount: money.amount,
      period: data.period,
      categoryId: data.categoryId ?? null,
      startDate: data.startDate ?? new Date(),
      createdAt: new Date(),
    })
  }

  static reconstitute(props: BudgetProps): Budget {
    return new Budget(props)
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
  get period(): BudgetPeriod {
    return this.props.period
  }
  get categoryId(): string | null {
    return this.props.categoryId
  }
  get startDate(): Date {
    return this.props.startDate
  }
  get createdAt(): Date {
    return this.props.createdAt
  }

  /** Date range this budget covers for the current period. */
  getCurrentRange(reference: Date = new Date()): DateRange {
    return getBudgetPeriodRange(this.props.period, reference)
  }

  /** Compute the budget status given the spent amount for the period. */
  computeStatus(spent: number): BudgetStatus {
    const spentMoney = Money.of(Math.max(0, spent))
    const remaining = Money.of(this.props.amount).subtract(spentMoney)
    const percentage = Math.min(
      Math.round((spentMoney.amount / this.props.amount) * 10000) / 100,
      999
    )
    return {
      spent: spentMoney.amount,
      remaining: remaining.amount,
      percentage,
      isOverBudget: remaining.isNegative(),
    }
  }

  changeAmount(amount: number): void {
    const money = Money.of(amount)
    if (!money.isPositive()) {
      throw new ValidationException('El monto del presupuesto debe ser positivo')
    }
    this.props.amount = money.amount
  }

  changePeriod(period: BudgetPeriod): void {
    this.props.period = period
  }
}
