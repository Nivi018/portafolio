/**
 * Standard API response shapes shared between backend and frontend.
 */

export interface ApiSuccess<T> {
  data: T
}

export interface ApiErrorBody {
  error: string
  code?: string
  details?: Record<string, string[]>
}

/**
 * Pagination metadata returned alongside paginated lists.
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedData<T> {
  items: T[]
  meta: PaginationMeta
}

/**
 * Query params for paginated endpoints.
 */
export interface PaginationQuery {
  page: number
  limit: number
}

/**
 * Date range used in filters and reports.
 */
export interface DateRange {
  from: Date
  to: Date
}
