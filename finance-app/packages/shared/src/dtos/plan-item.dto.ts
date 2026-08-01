import type { PlanItemFrequency, PlanItemType } from '../types/enums'

export interface PlanItemDto {
  id: string
  name: string
  amount: number
  type: PlanItemType
  frequency: PlanItemFrequency
  categoryId: string | null
  accountId: string | null
  isFixed: boolean
  isMicroExpense: boolean
  monthlyEquivalent: number
  yearlyEquivalent: number
  createdAt: string
  updatedAt: string
}
