import type { CategoryType } from '@finance/shared'
import type { Category } from '../../entities'
import type { ICategoryRepository } from '../../ports'

export interface GetCategoriesDeps {
  categoryRepo: ICategoryRepository
}

export function makeGetCategories(deps: GetCategoriesDeps) {
  return async (userId: string, type?: CategoryType): Promise<Category[]> => {
    if (type) {
      return deps.categoryRepo.findByUserIdAndType(userId, type)
    }
    return deps.categoryRepo.findByUserId(userId)
  }
}
