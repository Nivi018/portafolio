import { createRecurringSchema } from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import {
  makeCreateRecurring,
  makeGetRecurring,
  makeProcessDueRecurring,
  type RecurringTransaction,
} from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toRecurringDto } from '../../lib/dto'
import { env } from '../../lib/env'
import { requireSession } from '../../middleware/session'

const recurringRoutes = new Hono()

async function recurringDto(recurring: RecurringTransaction) {
  const [category, account] = await Promise.all([
    container.categoryRepo.findById(recurring.categoryId),
    container.accountRepo.findById(recurring.accountId),
  ])
  if (!category || !account) throw new Error(`Relación faltante en recurrencia ${recurring.id}`)
  return toRecurringDto(recurring, category, account)
}

// Global processing endpoint for a trusted scheduler only.
recurringRoutes.post('/process-due', async (c) => {
  const provided = c.req.header('x-cron-secret')
  if (!env.CRON_SECRET || provided !== env.CRON_SECRET) {
    return c.json({ error: 'No encontrado', code: 'NOT_FOUND' }, 404)
  }

  const result = await makeProcessDueRecurring({
    recurringRepo: container.recurringRepo,
    transactionRepo: container.transactionRepo,
    accountRepo: container.accountRepo,
  })()
  return c.json({ data: result })
})

recurringRoutes.use('*', requireSession)

recurringRoutes.get('/', async (c) => {
  const recurring = await makeGetRecurring({ recurringRepo: container.recurringRepo })(c.get('financialSpaceId'))
  return c.json({ data: await Promise.all(recurring.map(recurringDto)) })
})

recurringRoutes.post('/', zValidator('json', createRecurringSchema), async (c) => {
  const recurring = await makeCreateRecurring({
    recurringRepo: container.recurringRepo,
    accountRepo: container.accountRepo,
    categoryRepo: container.categoryRepo,
  })(c.get('financialSpaceId'), c.req.valid('json'))
  return c.json({ data: await recurringDto(recurring) }, 201)
})

export { recurringRoutes }
