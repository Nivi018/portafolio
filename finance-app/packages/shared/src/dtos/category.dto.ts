import type { CategoryType } from '../types/enums'

/**
 * Category DTOs.
 */

export interface CategoryDto {
  id: string
  name: string
  icon: string
  color: string
  type: CategoryType
  createdAt: string
}

/** Lightweight shape embedded in other DTOs (avoids over-fetching). */
export interface CategorySummaryDto {
  id: string
  name: string
  icon: string
  color: string
}
