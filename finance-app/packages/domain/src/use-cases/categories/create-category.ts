import type { CreateCategoryInput } from '@finance/shared'
import { Category } from '../../entities'
import { ValidationException } from '../../exceptions'
import type { ICategoryRepository } from '../../ports'

export interface CreateCategoryDeps {
  categoryRepo: ICategoryRepository
}

export function makeCreateCategory(deps: CreateCategoryDeps) {
  return async (userId: string, input: CreateCategoryInput): Promise<Category> => {
    const existing = await deps.categoryRepo.findByName(userId, input.name)
    if (existing) {
      throw new ValidationException(`Ya existe una categoría llamada "${input.name}"`)
    }

    const category = Category.create({ ...input, userId })
    return deps.categoryRepo.create(category)
  }
}
