import { makeGetDashboard, type Transaction } from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toDashboardDto, toTransactionDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const dashboardRoutes = new Hono().use('*', requireSession)

dashboardRoutes.get('/', async (c) => {
  const dashboard = await makeGetDashboard({
    accountRepo: container.accountRepo,
    transactionRepo: container.transactionRepo,
    budgetRepo: container.budgetRepo,
  })(c.get('userId'))

  const dto = await toDashboardDto(
    dashboard,
    async (transaction: Transaction) => {
      const [account, category] = await Promise.all([
        container.accountRepo.findById(transaction.accountId),
        transaction.categoryId ? container.categoryRepo.findById(transaction.categoryId) : null,
      ])
      if (!account) throw new Error(`Cuenta faltante para transacción ${transaction.id}`)
      return toTransactionDto(transaction, account, category)
    },
    (categoryId) => (categoryId ? container.categoryRepo.findById(categoryId) : Promise.resolve(null))
  )

  return c.json({ data: dto })
})

export { dashboardRoutes }
