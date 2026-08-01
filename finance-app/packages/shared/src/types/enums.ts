import type {
  TRANSACTION_TYPES,
  ACCOUNT_TYPES,
  ASSET_TYPES,
  BUDGET_PERIODS,
  RECURRENCE_FREQUENCIES,
  PLAN_ITEM_TYPES,
  PLAN_ITEM_FREQUENCIES,
  CATEGORY_TYPES,
  CURRENCIES,
  GOAL_STATUS,
  GOAL_PROJECTION_STATUS,
  FINANCIAL_SPACE_MEMBER_ROLES,
  FINANCIAL_SPACE_TYPES,
  CREDIT_UTILIZATION_ALERTS,
} from '../constants/enums'

/**
 * Union types derived from the const arrays in constants/enums.
 * Single source of truth: edit the const array, types update automatically.
 */

export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export type AccountType = (typeof ACCOUNT_TYPES)[number]
export type AssetType = (typeof ASSET_TYPES)[number]

export type BudgetPeriod = (typeof BUDGET_PERIODS)[number]

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number]

export type PlanItemType = (typeof PLAN_ITEM_TYPES)[number]

export type PlanItemFrequency = (typeof PLAN_ITEM_FREQUENCIES)[number]

export type CategoryType = (typeof CATEGORY_TYPES)[number]

export type Currency = (typeof CURRENCIES)[number]

export type GoalStatus = (typeof GOAL_STATUS)[number]

export type GoalProjectionStatus = (typeof GOAL_PROJECTION_STATUS)[number]

export type FinancialSpaceMemberRole = (typeof FINANCIAL_SPACE_MEMBER_ROLES)[number]

export type FinancialSpaceType = (typeof FINANCIAL_SPACE_TYPES)[number]

export type CreditUtilizationAlert = (typeof CREDIT_UTILIZATION_ALERTS)[number]
