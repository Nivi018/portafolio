import type { PlanItemType } from '../types/enums'

export interface PlanVsActualTotalsDto {
  plannedIncome: number
  plannedExpense: number
  plannedNet: number
  actualIncome: number
  actualExpense: number
  actualNet: number
  variance: number
}

export interface PlanVsActualCategoryDto {
  type: PlanItemType
  categoryId: string | null
  planned: number
  actual: number
  variance: number
}

export interface PlanVsActualMonthDto extends PlanVsActualTotalsDto {
  month: string // "2026-01"
  categories: PlanVsActualCategoryDto[]
}

export interface PlanVsActualDto extends PlanVsActualTotalsDto {
  months: PlanVsActualMonthDto[]
}
