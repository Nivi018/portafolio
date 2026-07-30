import type { GoalStatus } from '@finance/shared'
import { ValidationException } from '../exceptions'
import { Money } from '../value-objects'

export interface GoalProps {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date | null
  createdAt: Date
}

export interface CreateGoalData {
  name: string
  targetAmount: number
  deadline?: Date | null
  userId: string
}

/**
 * Savings goal entity.
 * Status is derived: COMPLETED when current >= target.
 */
export class Goal {
  private constructor(private props: GoalProps) {}

  static create(data: CreateGoalData): Goal {
    if (!data.name.trim()) {
      throw new ValidationException('El nombre de la meta es requerido')
    }
    const target = Money.of(data.targetAmount)
    if (!target.isPositive()) {
      throw new ValidationException('La meta debe ser positiva')
    }
    return new Goal({
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name.trim(),
      targetAmount: target.amount,
      currentAmount: 0,
      deadline: data.deadline ?? null,
      createdAt: new Date(),
    })
  }

  static reconstitute(props: GoalProps): Goal {
    return new Goal(props)
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
  get targetAmount(): number {
    return this.props.targetAmount
  }
  get currentAmount(): number {
    return this.props.currentAmount
  }
  get deadline(): Date | null {
    return this.props.deadline
  }
  get createdAt(): Date {
    return this.props.createdAt
  }

  get status(): GoalStatus {
    return this.props.currentAmount >= this.props.targetAmount ? 'COMPLETED' : 'IN_PROGRESS'
  }

  contribute(amount: number): void {
    const money = Money.of(amount)
    if (!money.isPositive()) {
      throw new ValidationException('La contribución debe ser positiva')
    }
    this.props.currentAmount = Money.of(this.props.currentAmount).add(money).amount
  }

  getProgress(): number {
    return Math.min(Math.round((this.props.currentAmount / this.props.targetAmount) * 10000) / 100, 100)
  }

  getRemainingAmount(): number {
    return Math.max(
      Money.of(this.props.targetAmount).subtract(Money.of(this.props.currentAmount)).amount,
      0
    )
  }

  getDaysRemaining(reference: Date = new Date()): number | null {
    if (!this.props.deadline) return null
    const diffMs = this.props.deadline.getTime() - reference.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  rename(name: string): void {
    if (!name.trim()) throw new ValidationException('El nombre de la meta es requerido')
    this.props.name = name.trim()
  }

  changeTarget(amount: number): void {
    const money = Money.of(amount)
    if (!money.isPositive()) throw new ValidationException('La meta debe ser positiva')
    this.props.targetAmount = money.amount
  }

  changeDeadline(deadline: Date | null): void {
    this.props.deadline = deadline
  }
}
