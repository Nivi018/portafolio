/**
 * Enum constants used across the application.
 * These serve as the single source of truth for Zod schemas,
 * Prisma values, and UI select options.
 */

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'TRANSFER'] as const

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CASH', 'CREDIT'] as const

export const ASSET_TYPES = ['CASH', 'INVESTMENT', 'PROPERTY', 'VEHICLE', 'OTHER'] as const

export const BUDGET_PERIODS = ['WEEKLY', 'MONTHLY', 'YEARLY'] as const

export const RECURRENCE_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const

export const PLAN_ITEM_TYPES = ['INCOME', 'EXPENSE'] as const

export const PLAN_ITEM_FREQUENCIES = [
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'BIMONTHLY',
  'QUARTERLY',
  'SEMIANNUAL',
  'YEARLY',
] as const

export const CATEGORY_TYPES = ['INCOME', 'EXPENSE'] as const

export const CURRENCIES = ['MXN', 'USD', 'EUR'] as const

export const GOAL_STATUS = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

export const GOAL_PROJECTION_STATUS = ['ON_TRACK', 'AT_RISK', 'UNFUNDED', 'COMPLETED'] as const

export const FINANCIAL_SPACE_MEMBER_ROLES = ['OWNER', 'EDITOR', 'VIEWER'] as const

export const FINANCIAL_SPACE_TYPES = ['PERSONAL', 'HOUSEHOLD'] as const

/** Threshold classification for the percentage of a card's limit in use. */
export const CREDIT_UTILIZATION_ALERTS = ['NONE', 'ATTENTION', 'HIGH', 'OVER_LIMIT'] as const
