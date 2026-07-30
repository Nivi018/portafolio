import {
  createTransactionSchema,
  importCsvSchema,
  transactionFiltersSchema,
  updateTransactionSchema,
} from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import {
  makeCreateTransaction,
  makeDeleteTransaction,
  makeGetTransactions,
  makeImportCsv,
  makeUpdateTransaction,
  type Transaction,
} from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toTransactionDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const transactionsRoutes = new Hono().use('*', requireSession)

async function transactionDto(transaction: Transaction) {
  const [account, category] = await Promise.all([
    container.accountRepo.findById(transaction.accountId),
    transaction.categoryId ? container.categoryRepo.findById(transaction.categoryId) : null,
  ])
  if (!account) throw new Error(`Cuenta faltante para transacción ${transaction.id}`)
  return toTransactionDto(transaction, account, category)
}

transactionsRoutes.get('/', zValidator('query', transactionFiltersSchema), async (c) => {
  const result = await makeGetTransactions({ transactionRepo: container.transactionRepo })(
    c.get('userId'),
    c.req.valid('query')
  )

  return c.json({
    data: {
      items: await Promise.all(result.items.map(transactionDto)),
      meta: {
        page: c.req.valid('query').page,
        limit: c.req.valid('query').limit,
        total: result.total,
        totalPages: Math.ceil(result.total / c.req.valid('query').limit),
      },
    },
  })
})

transactionsRoutes.post('/', zValidator('json', createTransactionSchema), async (c) => {
  const transaction = await makeCreateTransaction({
    transactionRepo: container.transactionRepo,
    accountRepo: container.accountRepo,
    categoryRepo: container.categoryRepo,
  })(c.get('userId'), c.req.valid('json'))

  return c.json({ data: await transactionDto(transaction) }, 201)
})

transactionsRoutes.post('/import', zValidator('json', importCsvSchema), async (c) => {
  const input = c.req.valid('json')
  const result = await makeImportCsv({
    transactionRepo: container.transactionRepo,
    accountRepo: container.accountRepo,
    categoryRepo: container.categoryRepo,
  })(c.get('userId'), input.accountId, input.rows)

  return c.json({ data: result }, 201)
})

transactionsRoutes.patch('/:id', zValidator('json', updateTransactionSchema), async (c) => {
  const transaction = await makeUpdateTransaction({
    transactionRepo: container.transactionRepo,
    accountRepo: container.accountRepo,
    categoryRepo: container.categoryRepo,
  })(c.get('userId'), c.req.param('id'), c.req.valid('json'))

  return c.json({ data: await transactionDto(transaction) })
})

transactionsRoutes.delete('/:id', async (c) => {
  await makeDeleteTransaction({
    transactionRepo: container.transactionRepo,
    accountRepo: container.accountRepo,
  })(c.get('userId'), c.req.param('id'))
  return c.body(null, 204)
})

export { transactionsRoutes }
