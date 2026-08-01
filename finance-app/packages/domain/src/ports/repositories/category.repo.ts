import type { CategoryType } from '@finance/shared'
import type { Category } from '../../entities'

/**
 * Port: Category repository.
 */
export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>
  findByFinancialSpaceId(financialSpaceId: string): Promise<Category[]>
  findByFinancialSpaceIdAndType(
    financialSpaceId: string,
    type: CategoryType
  ): Promise<Category[]>
  findByName(financialSpaceId: string, name: string): Promise<Category | null>
  create(category: Category): Promise<Category>
  createMany(categories: Category[]): Promise<Category[]>
  update(category: Category): Promise<Category>
  delete(id: string): Promise<void>
  hasTransactions(id: string): Promise<boolean>
}
