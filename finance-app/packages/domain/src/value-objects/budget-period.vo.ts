import type { BudgetPeriod } from '@finance/shared'
import { DateRange } from './date-range.vo'

/**
 * Resolves the date range a budget period covers for a given reference date.
 */
export function getBudgetPeriodRange(period: BudgetPeriod, reference: Date = new Date()): DateRange {
  switch (period) {
    case 'WEEKLY':
      return DateRange.currentWeek(reference)
    case 'MONTHLY':
      return DateRange.currentMonth(reference)
    case 'YEARLY':
      return DateRange.currentYear(reference)
  }
}
