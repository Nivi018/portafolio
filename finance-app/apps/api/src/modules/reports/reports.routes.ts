import { dateRangeQuerySchema } from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import { DateRange } from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { requireSession } from '../../middleware/session'

const reportsRoutes = new Hono().use('*', requireSession)

reportsRoutes.get('/income-expense', zValidator('query', dateRangeQuerySchema), async (c) => {
  const { from, to } = c.req.valid('query')
  if (!from || !to) {
    return c.json({ error: 'from y to son requeridos', code: 'VALIDATION_ERROR' }, 400)
  }

  const range = DateRange.of(from, to)
  const userId = c.get('userId')
  const [summary, expensesByCategory, incomeByCategory, monthlyFlow] = await Promise.all([
    container.transactionRepo.getSummary(userId, range),
    container.transactionRepo.getCategoryTotals(userId, range, 'EXPENSE'),
    container.transactionRepo.getCategoryTotals(userId, range, 'INCOME'),
    container.transactionRepo.getMonthlyFlow(userId, 6),
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

export { reportsRoutes }
