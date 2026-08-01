import { NotFoundException, ValidationException } from '../../exceptions'
import type { ICategoryRepository } from '../../ports'

export interface DeleteCategoryDeps {
  categoryRepo: ICategoryRepository
}

export function makeDeleteCategory(deps: DeleteCategoryDeps) {
  return async (financialSpaceId: string, categoryId: string): Promise<void> => {
    const category = await deps.categoryRepo.findById(categoryId)
    if (!category || category.financialSpaceId !== financialSpaceId) {
      throw new NotFoundException('Category')
    }

    if (await deps.categoryRepo.hasTransactions(categoryId)) {
      throw new ValidationException(
        'No puedes eliminar una categoría con transacciones. Reasigna las transacciones primero.'
      )
    }

    await deps.categoryRepo.delete(categoryId)
  }
}
