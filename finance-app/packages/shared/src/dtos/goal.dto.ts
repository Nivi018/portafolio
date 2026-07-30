import type { GoalStatus } from '../types/enums'

/**
 * Savings goal DTOs.
 */

export interface GoalDto {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  status: GoalStatus
  createdAt: string
}

export interface GoalWithProgressDto extends GoalDto {
  percentage: number
  remainingAmount: number
  daysRemaining: number | null
}
