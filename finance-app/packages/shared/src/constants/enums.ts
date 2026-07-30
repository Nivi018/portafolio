/**
 * Enum constants used across the application.
 * These serve as the single source of truth for Zod schemas,
 * Prisma values, and UI select options.
 */

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'TRANSFER'] as const

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CASH', 'CREDIT'] as const

export const BUDGET_PERIODS = ['WEEKLY', 'MONTHLY', 'YEARLY'] as const

export const RECURRENCE_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const

export const CATEGORY_TYPES = ['INCOME', 'EXPENSE'] as const

export const CURRENCIES = ['MXN', 'USD', 'EUR'] as const

export const GOAL_STATUS = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
