import { dateRangeQuerySchema } from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import { DateRange, makeGetPlanVsActual } from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { requireSession } from '../../middleware/session'

const reportsRoutes = new Hono().use('*', requireSession)

// Query dates are calendar days. Rebuild them locally so YYYY-MM-DD does not shift a month by UTC parsing.
function calendarRange(from: Date, to: Date): DateRange {
  return DateRange.of(
    new Date(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
    new Date(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
  )
}

reportsRoutes.get('/income-expense', zValidator('query', dateRangeQuerySchema), async (c) => {
  const { from, to } = c.req.valid('query')
  if (!from || !to) {
    return c.json({ error: 'from y to son requeridos', code: 'VALIDATION_ERROR' }, 400)
  }

  const range = calendarRange(from, to)
  const financialSpaceId = c.get('financialSpaceId')
  const [summary, expensesByCategory, incomeByCategory, monthlyFlow] = await Promise.all([
    container.transactionRepo.getSummary(financialSpaceId, range),
    container.transactionRepo.getCategoryTotals(financialSpaceId, range, 'EXPENSE'),
    container.transactionRepo.getCategoryTotals(financialSpaceId, range, 'INCOME'),
    container.transactionRepo.getMonthlyFlow(financialSpaceId, 6),
  ])

  const withPercentages = (items: typeof expensesByCategory) => {
    const total = items.reduce((sum, item) => sum + item.total, 0)
    return items.map((item) => ({
      ...item,
      percentage: total ? Math.round((item.total / total) * 10000) / 100 : 0,
    }))
  }

  return c.json({
    data: {
      period: { from: from.toISOString(), to: to.toISOString() },
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      netBalance: summary.netBalance,
      monthlyFlow,
      expensesByCategory: withPercentages(expensesByCategory),
      incomeByCategory: withPercentages(incomeByCategory),
    },
  })
})

reportsRoutes.get('/plan-vs-actual', zValidator('query', dateRangeQuerySchema), async (c) => {
  const { from, to } = c.req.valid('query')
  if (!from || !to) {
    return c.json({ error: 'from y to son requeridos', code: 'VALIDATION_ERROR' }, 400)
  }

  const comparison = await makeGetPlanVsActual({
    planItemRepo: container.planItemRepo,
    transactionRepo: container.transactionRepo,
  })(c.get('financialSpaceId'), calendarRange(from, to))

  return c.json({
    data: {
      ...comparison,
      period: { from: from.toISOString(), to: to.toISOString() },
    },
  })
})

export { reportsRoutes }
