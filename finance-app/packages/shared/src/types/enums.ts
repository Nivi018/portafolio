import type {
  TRANSACTION_TYPES,
  ACCOUNT_TYPES,
  BUDGET_PERIODS,
  RECURRENCE_FREQUENCIES,
  CATEGORY_TYPES,
  CURRENCIES,
  GOAL_STATUS,
} from '../constants/enums'

/**
 * Union types derived from the const arrays in constants/enums.
 * Single source of truth: edit the const array, types update automatically.
 */

export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export type AccountType = (typeof ACCOUNT_TYPES)[number]

export type BudgetPeriod = (typeof BUDGET_PERIODS)[number]

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number]

export type CategoryType = (typeof CATEGORY_TYPES)[number]

export type Currency = (typeof CURRENCIES)[number]

export type GoalStatus = (typeof GOAL_STATUS)[number]
