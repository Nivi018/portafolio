import type { CsvTransactionRow } from '@finance/shared'
import { Transaction, Category } from '../../entities'
import { NotFoundException } from '../../exceptions'
import type {
  ITransactionRepository,
  IAccountRepository,
  ICategoryRepository,
} from '../../ports'

export interface ImportCsvDeps {
  transactionRepo: ITransactionRepository
  accountRepo: IAccountRepository
  categoryRepo: ICategoryRepository
}

export interface ImportCsvResult {
  imported: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

/**
 * Bulk import transactions from parsed CSV rows.
 * Categories are matched by name (case-insensitive) or created on demand.
 * Rows that fail validation are reported and skipped without aborting the import.
 */
export function makeImportCsv(deps: ImportCsvDeps) {
  return async (
    financialSpaceId: string,
    accountId: string,
    rows: CsvTransactionRow[]
  ): Promise<ImportCsvResult> => {
    const account = await deps.accountRepo.findById(accountId)
    if (!account || account.financialSpaceId !== financialSpaceId) {
      throw new NotFoundException('Account')
    }

    const result: ImportCsvResult = { imported: 0, skipped: 0, errors: [] }
    const categoryCache = new Map<string, Category>()

    const resolveCategory = async (name: string, type: 'INCOME' | 'EXPENSE') => {
      const key = `${type}:${name.toLowerCase()}`
      const cached = categoryCache.get(key)
      if (cached) return cached

      let category = await deps.categoryRepo.findByName(financialSpaceId, name)
      if (!category) {
        category = await deps.categoryRepo.create(
          Category.create({ name, icon: 'tag', color: '#6b7280', type, financialSpaceId })
        )
      }
      categoryCache.set(key, category)
      return category
    }

    for (const [index, row] of rows.entries()) {
      try {
        const category = await resolveCategory(row.category, row.type)
        const transaction = Transaction.create({
          amount: row.amount,
          description: row.description ?? null,
          type: row.type,
          date: row.date,
          categoryId: category.id,
          accountId,
          financialSpaceId,
        })
        account.applyTransaction(transaction)
        await deps.transactionRepo.create(transaction)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({
          row: index + 1,
          message: error instanceof Error ? error.message : 'Error desconocido',
        })
      }
    }

    if (result.imported > 0) {
      await deps.accountRepo.update(account)
    }

    return result
  }
}
