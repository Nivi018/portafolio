import type {
  PlanItemType,
  PlanVsActualCategoryDto,
  PlanVsActualDto,
  PlanVsActualMonthDto,
} from '@finance/shared'
import type { DateRange } from '../../value-objects'
import type { IPlanItemRepository, ITransactionRepository } from '../../ports'

export interface GetPlanVsActualDeps {
  planItemRepo: IPlanItemRepository
  transactionRepo: ITransactionRepository
}

function getMonths(range: DateRange): string[] {
  const months: string[] = []
  const cursor = new Date(range.from.getFullYear(), range.from.getMonth(), 1)
  const last = new Date(range.to.getFullYear(), range.to.getMonth(), 1)

  while (cursor <= last) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
}

function makeTotals(
  plannedIncome: number,
  plannedExpense: number,
  actualIncome: number,
  actualExpense: number
) {
  const plannedNet = plannedIncome - plannedExpense
  const actualNet = actualIncome - actualExpense
  return {
    plannedIncome,
    plannedExpense,
    plannedNet,
    actualIncome,
    actualExpense,
    actualNet,
    variance: actualNet - plannedNet,
  }
}

/** Compares the current recurring plan with recorded activity for each selected month. */
export function makeGetPlanVsActual(deps: GetPlanVsActualDeps) {
  return async (financialSpaceId: string, range: DateRange): Promise<PlanVsActualDto> => {
    const [planItems, actualTotals] = await Promise.all([
      deps.planItemRepo.findByFinancialSpaceId(financialSpaceId),
      deps.transactionRepo.getMonthlyCategoryTotals(financialSpaceId, range),
    ])
    const months = getMonths(range)
    const plannedByCategory = new Map<string, number>()

    for (const item of planItems) {
      const key = `${item.type}:${item.categoryId ?? ''}`
      plannedByCategory.set(key, (plannedByCategory.get(key) ?? 0) + item.monthlyEquivalent)
    }

    const actualByMonth = new Map<string, Map<string, number>>()
    for (const actual of actualTotals) {
      if (actual.type === 'TRANSFER') continue
      const key = `${actual.type}:${actual.categoryId ?? ''}`
      const byCategory = actualByMonth.get(actual.month) ?? new Map<string, number>()
      byCategory.set(key, (byCategory.get(key) ?? 0) + actual.total)
      actualByMonth.set(actual.month, byCategory)
    }

    const rows: PlanVsActualMonthDto[] = months.map((month) => {
      const actualCategories = actualByMonth.get(month) ?? new Map<string, number>()
      const categoryKeys = new Set([...plannedByCategory.keys(), ...actualCategories.keys()])
      const categories: PlanVsActualCategoryDto[] = [...categoryKeys]
        .map((key) => {
          const [type, categoryId] = key.split(':') as [PlanItemType, string]
          const planned = plannedByCategory.get(key) ?? 0
          const actual = actualCategories.get(key) ?? 0
          return { type, categoryId: categoryId || null, planned, actual, variance: actual - planned }
        })
        .sort((a, b) => a.type.localeCompare(b.type) || (a.categoryId ?? '').localeCompare(b.categoryId ?? ''))

      const plannedIncome = categories
        .filter((category) => category.type === 'INCOME')
        .reduce((total, category) => total + category.planned, 0)
      const plannedExpense = categories
        .filter((category) => category.type === 'EXPENSE')
        .reduce((total, category) => total + category.planned, 0)
      const actualIncome = categories
        .filter((category) => category.type === 'INCOME')
        .reduce((total, category) => total + category.actual, 0)
      const actualExpense = categories
        .filter((category) => category.type === 'EXPENSE')
        .reduce((total, category) => total + category.actual, 0)

      return { month, categories, ...makeTotals(plannedIncome, plannedExpense, actualIncome, actualExpense) }
    })

    return {
      months: rows,
      ...makeTotals(
        rows.reduce((total, row) => total + row.plannedIncome, 0),
        rows.reduce((total, row) => total + row.plannedExpense, 0),
        rows.reduce((total, row) => total + row.actualIncome, 0),
        rows.reduce((total, row) => total + row.actualExpense, 0)
      ),
    }
  }
}
