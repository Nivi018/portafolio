import type { FinancialSpaceMemberRole } from '../types'

/**
 * User-related DTOs (API response shapes).
 * Dates are ISO strings in JSON responses.
 */

export interface UserDto {
  id: string
  name: string
  email: string
  image: string | null
  createdAt: string
  financialSpace?: {
    id: string
    name: string
    role: FinancialSpaceMemberRole
  }
}

export interface SessionUserDto {
  id: string
  name: string
  email: string
  image: string | null
}
