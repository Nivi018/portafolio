import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '@finance/shared'
import { Category } from '../../entities'
import type { ICategoryRepository } from '../../ports'

export interface CreateDefaultCategoriesDeps {
  categoryRepo: ICategoryRepository
}

/**
 * Seed a new financial space with the default category set.
 * Idempotent: skips categories the financial space already has by name.
 */
export function makeCreateDefaultCategories(deps: CreateDefaultCategoriesDeps) {
  return async (financialSpaceId: string): Promise<Category[]> => {
    const existing = await deps.categoryRepo.findByFinancialSpaceId(financialSpaceId)
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase()))

    const toCreate: Category[] = []

    for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
      if (!existingNames.has(cat.name.toLowerCase())) {
        toCreate.push(Category.create({ ...cat, type: 'EXPENSE', financialSpaceId }))
      }
    }
    for (const cat of DEFAULT_INCOME_CATEGORIES) {
      if (!existingNames.has(cat.name.toLowerCase())) {
        toCreate.push(Category.create({ ...cat, type: 'INCOME', financialSpaceId }))
      }
    }

    if (toCreate.length === 0) return []
    return deps.categoryRepo.createMany(toCreate)
  }
}
