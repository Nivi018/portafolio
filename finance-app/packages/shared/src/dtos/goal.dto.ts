import type { GoalProjectionStatus, GoalStatus } from '../types/enums'

/**
 * Savings goal DTOs.
 */

export interface GoalDto {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  expectedAnnualReturn: number
  monthlyContributionTarget: number | null
  status: GoalStatus
  createdAt: string
}

export interface GoalWithProgressDto extends GoalDto {
  percentage: number
  remainingAmount: number
  daysRemaining: number | null
  monthsToDeadline: number | null
  projectedAmount: number | null
  requiredMonthlyContribution: number | null
  projectionStatus: GoalProjectionStatus
}
