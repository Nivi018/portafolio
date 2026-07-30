import { z } from 'zod'
import { TRANSACTION_TYPES } from '../constants/enums'
import { VALIDATION_LIMITS } from '../constants/defaults'
import { paginationQuerySchema, dateRangeQuerySchema, searchQuerySchema } from './common.schema'

/**
 * Transaction validation schemas.
 */

export const createTransactionSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).optional(),
  type: z.enum(TRANSACTION_TYPES),
  date: z.coerce.date().default(() => new Date()),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  accountId: z.string().min(1, 'La cuenta es requerida'),
})
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

export const updateTransactionSchema = createTransactionSchema.partial()
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

/**
 * Query filters for listing transactions (combines pagination, date range, search).
 */
export const transactionFiltersSchema = paginationQuerySchema
  .merge(dateRangeQuerySchema)
  .merge(searchQuerySchema)
  .extend({
    type: z.enum(TRANSACTION_TYPES).optional(),
    categoryId: z.string().optional(),
    accountId: z.string().optional(),
  })
export type TransactionFiltersInput = z.input<typeof transactionFiltersSchema>
export type TransactionFiltersOutput = z.output<typeof transactionFiltersSchema>

/**
 * Single row of a CSV import file.
 * Values arrive as strings and are validated/coerced.
 */
export const csvTransactionRowSchema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).optional(),
})
export type CsvTransactionRow = z.infer<typeof csvTransactionRowSchema>

export const importCsvSchema = z.object({
  accountId: z.string().min(1),
  rows: z.array(csvTransactionRowSchema).min(1).max(1000),
})
export type ImportCsvInput = z.infer<typeof importCsvSchema>
