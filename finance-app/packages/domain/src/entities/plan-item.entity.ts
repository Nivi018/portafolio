import type { PlanItemFrequency, PlanItemType } from '@finance/shared'
import { ValidationException } from '../exceptions'
import { Money } from '../value-objects'

export interface PlanItemProps {
  id: string
  financialSpaceId: string
  name: string
  amount: number
  type: PlanItemType
  frequency: PlanItemFrequency
  categoryId: string | null
  accountId: string | null
  isFixed: boolean
  isMicroExpense: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreatePlanItemData {
  financialSpaceId: string
  name: string
  amount: number
  type: PlanItemType
  frequency: PlanItemFrequency
  categoryId?: string
  accountId?: string
  isFixed?: boolean
  isMicroExpense?: boolean
}

const YEARLY_OCCURRENCES: Record<PlanItemFrequency, number> = {
  DAILY: 365.2425,
  WEEKLY: 52.1775,
  BIWEEKLY: 26.08875,
  MONTHLY: 12,
  BIMONTHLY: 6,
  QUARTERLY: 4,
  SEMIANNUAL: 2,
  YEARLY: 1,
}

export class PlanItem {
  private constructor(private props: PlanItemProps) {}

  static create(data: CreatePlanItemData): PlanItem {
    if (!data.name.trim()) throw new ValidationException('El nombre del plan es requerido')
    if (data.type === ('TRANSFER' as string)) {
      throw new ValidationException('Las transferencias no pueden ser elementos del plan')
    }
    const amount = Money.of(data.amount)
    if (!amount.isPositive()) throw new ValidationException('El monto debe ser positivo')
    const now = new Date()
    return new PlanItem({
      id: crypto.randomUUID(),
      financialSpaceId: data.financialSpaceId,
      name: data.name.trim(),
      amount: amount.amount,
      type: data.type,
      frequency: data.frequency,
      categoryId: data.categoryId ?? null,
      accountId: data.accountId ?? null,
      isFixed: data.isFixed ?? false,
      isMicroExpense: data.isMicroExpense ?? false,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: PlanItemProps): PlanItem {
    return new PlanItem(props)
  }

  get id() { return this.props.id }
  get financialSpaceId() { return this.props.financialSpaceId }
  get name() { return this.props.name }
  get amount() { return this.props.amount }
  get type() { return this.props.type }
  get frequency() { return this.props.frequency }
  get categoryId() { return this.props.categoryId }
  get accountId() { return this.props.accountId }
  get isFixed() { return this.props.isFixed }
  get isMicroExpense() { return this.props.isMicroExpense }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  get yearlyEquivalent(): number {
    return Money.of(this.amount * YEARLY_OCCURRENCES[this.frequency]).amount
  }

  get monthlyEquivalent(): number {
    return Money.of((this.amount * YEARLY_OCCURRENCES[this.frequency]) / 12).amount
  }

  update(data: Partial<Omit<CreatePlanItemData, 'financialSpaceId'>>): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) throw new ValidationException('El nombre del plan es requerido')
      this.props.name = data.name.trim()
    }
    if (data.amount !== undefined) {
      const amount = Money.of(data.amount)
      if (!amount.isPositive()) throw new ValidationException('El monto debe ser positivo')
      this.props.amount = amount.amount
    }
    if (data.type !== undefined) {
      if (data.type === ('TRANSFER' as string)) {
        throw new ValidationException('Las transferencias no pueden ser elementos del plan')
      }
      this.props.type = data.type
    }
    if (data.frequency !== undefined) this.props.frequency = data.frequency
    if (data.categoryId !== undefined) this.props.categoryId = data.categoryId
    if (data.accountId !== undefined) this.props.accountId = data.accountId
    if (data.isFixed !== undefined) this.props.isFixed = data.isFixed
    if (data.isMicroExpense !== undefined) this.props.isMicroExpense = data.isMicroExpense
    this.props.updatedAt = new Date()
  }
}
