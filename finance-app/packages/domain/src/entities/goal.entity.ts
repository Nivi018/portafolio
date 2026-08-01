import type { GoalProjectionStatus, GoalStatus } from '@finance/shared'
import { ValidationException } from '../exceptions'
import { Money } from '../value-objects'

export interface GoalProps {
  id: string
  financialSpaceId: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date | null
  expectedAnnualReturn: number
  monthlyContributionTarget: number | null
  createdAt: Date
}

export interface CreateGoalData {
  name: string
  targetAmount: number
  deadline?: Date | null
  expectedAnnualReturn?: number
  monthlyContributionTarget?: number | null
  financialSpaceId: string
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
    if (data.expectedAnnualReturn !== undefined && (!Number.isFinite(data.expectedAnnualReturn) || data.expectedAnnualReturn < 0)) {
      throw new ValidationException('El rendimiento esperado no puede ser negativo')
    }
    if (data.monthlyContributionTarget !== undefined && data.monthlyContributionTarget !== null && (!Number.isFinite(data.monthlyContributionTarget) || data.monthlyContributionTarget < 0)) {
      throw new ValidationException('El aporte mensual no puede ser negativo')
    }
    return new Goal({
      id: crypto.randomUUID(),
      financialSpaceId: data.financialSpaceId,
      name: data.name.trim(),
      targetAmount: target.amount,
      currentAmount: 0,
      deadline: data.deadline ?? null,
      expectedAnnualReturn: data.expectedAnnualReturn ?? 0,
      monthlyContributionTarget: data.monthlyContributionTarget ?? null,
      createdAt: new Date(),
    })
  }

  static reconstitute(props: GoalProps): Goal {
    return new Goal(props)
  }

  get id(): string {
    return this.props.id
  }
  get financialSpaceId(): string {
    return this.props.financialSpaceId
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
  get expectedAnnualReturn(): number {
    return this.props.expectedAnnualReturn
  }
  get monthlyContributionTarget(): number | null {
    return this.props.monthlyContributionTarget
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

  getMonthsToDeadline(reference: Date = new Date()): number | null {
    if (!this.props.deadline) return null
    const diffMs = this.props.deadline.getTime() - reference.getTime()
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.4375)))
  }

  getProjectedAmount(reference: Date = new Date()): number | null {
    const months = this.getMonthsToDeadline(reference)
    if (months === null) return null

    const monthlyRate = this.props.expectedAnnualReturn / 1200
    const contribution = this.props.monthlyContributionTarget ?? 0
    if (monthlyRate === 0) return this.props.currentAmount + contribution * months

    const growth = (1 + monthlyRate) ** months
    return this.props.currentAmount * growth + contribution * ((growth - 1) / monthlyRate)
  }

  getRequiredMonthlyContribution(reference: Date = new Date()): number | null {
    const months = this.getMonthsToDeadline(reference)
    if (months === null || months === 0) return null

    const monthlyRate = this.props.expectedAnnualReturn / 1200
    const growth = (1 + monthlyRate) ** months
    const remainingAtDeadline = this.props.targetAmount - this.props.currentAmount * growth
    if (remainingAtDeadline <= 0) return 0
    if (monthlyRate === 0) return remainingAtDeadline / months
    return (remainingAtDeadline * monthlyRate) / (growth - 1)
  }

  getProjectionStatus(reference: Date = new Date()): GoalProjectionStatus {
    if (this.status === 'COMPLETED') return 'COMPLETED'
    const projectedAmount = this.getProjectedAmount(reference)
    if (projectedAmount === null || this.getMonthsToDeadline(reference) === 0) return 'UNFUNDED'
    if (projectedAmount >= this.props.targetAmount) return 'ON_TRACK'
    return this.props.monthlyContributionTarget === null ? 'UNFUNDED' : 'AT_RISK'
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

  changeExpectedAnnualReturn(expectedAnnualReturn: number): void {
    if (!Number.isFinite(expectedAnnualReturn) || expectedAnnualReturn < 0) {
      throw new ValidationException('El rendimiento esperado no puede ser negativo')
    }
    this.props.expectedAnnualReturn = expectedAnnualReturn
  }

  changeMonthlyContributionTarget(monthlyContributionTarget: number | null): void {
    if (monthlyContributionTarget !== null && (!Number.isFinite(monthlyContributionTarget) || monthlyContributionTarget < 0)) {
      throw new ValidationException('El aporte mensual no puede ser negativo')
    }
    this.props.monthlyContributionTarget = monthlyContributionTarget
  }
}
