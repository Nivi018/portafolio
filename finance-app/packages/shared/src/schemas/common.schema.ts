import { z } from 'zod'
import { PAGINATION, VALIDATION_LIMITS } from '../constants/defaults'

/**
 * Common reusable schemas: ids, pagination, date ranges.
 */

export const idParamSchema = z.object({
  id: z.string().min(1),
})
export type IdParam = z.infer<typeof idParamSchema>

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
})
export type PaginationQueryInput = z.input<typeof paginationQuerySchema>
export type PaginationQueryOutput = z.output<typeof paginationQuerySchema>

export const dateRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>

export const searchQuerySchema = z.object({
  search: z.string().max(VALIDATION_LIMITS.SEARCH_MAX).optional(),
})
