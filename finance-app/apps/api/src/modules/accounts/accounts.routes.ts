import {
  createAccountSchema,
  transferFundsSchema,
  updateAccountSchema,
} from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import {
  makeCreateAccount,
  makeDeleteAccount,
  makeGetAccounts,
  makeTransferFunds,
  makeUpdateAccount,
} from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toAccountDto, toTransactionDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const accountsRoutes = new Hono().use('*', requireSession)

accountsRoutes.get('/', async (c) => {
  const accounts = await makeGetAccounts({ accountRepo: container.accountRepo })(c.get('financialSpaceId'))
  return c.json({ data: accounts.map(toAccountDto) })
})

accountsRoutes.post('/', zValidator('json', createAccountSchema), async (c) => {
  const account = await makeCreateAccount({ accountRepo: container.accountRepo })(
    c.get('financialSpaceId'),
    c.req.valid('json')
  )
  return c.json({ data: toAccountDto(account) }, 201)
})

accountsRoutes.post('/transfer', zValidator('json', transferFundsSchema), async (c) => {
  const result = await makeTransferFunds({
    accountRepo: container.accountRepo,
    transactionRepo: container.transactionRepo,
  })(c.get('financialSpaceId'), c.req.valid('json'))

  const [from, to] = await Promise.all([
    container.accountRepo.findById(result.outgoing.accountId),
    container.accountRepo.findById(result.incoming.accountId),
  ])

  if (!from || !to) throw new Error('Transferencia con cuentas inconsistentes')

  return c.json(
    {
      data: {
        outgoing: toTransactionDto(result.outgoing, from, null),
        incoming: toTransactionDto(result.incoming, to, null),
      },
    },
    201
  )
})

accountsRoutes.patch('/:id', zValidator('json', updateAccountSchema), async (c) => {
  const account = await makeUpdateAccount({ accountRepo: container.accountRepo })(
    c.get('financialSpaceId'),
    c.req.param('id'),
    c.req.valid('json')
  )
  return c.json({ data: toAccountDto(account) })
})

accountsRoutes.delete('/:id', async (c) => {
  await makeDeleteAccount({ accountRepo: container.accountRepo })(
    c.get('financialSpaceId'),
    c.req.param('id')
  )
  return c.body(null, 204)
})

export { accountsRoutes }
