import {
  createCreditCardProfileSchema,
  updateCreditCardProfileSchema,
} from '@finance/shared'
import {
  makeCreateCreditCardProfile,
  makeGetCreditCardSummaries,
  makeUpdateCreditCardProfile,
} from '@finance/domain'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toCreditCardProfileDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const creditCardsRoutes = new Hono().use('*', requireSession)

creditCardsRoutes.get('/', async (c) => {
  const cards = await makeGetCreditCardSummaries({
    accountRepo: container.accountRepo,
    creditCardProfileRepo: container.creditCardProfileRepo,
  })(c.get('financialSpaceId'))
  return c.json({ data: cards })
})

creditCardsRoutes.post('/', zValidator('json', createCreditCardProfileSchema), async (c) => {
  const profile = await makeCreateCreditCardProfile({
    accountRepo: container.accountRepo,
    creditCardProfileRepo: container.creditCardProfileRepo,
  })(c.get('financialSpaceId'), c.req.valid('json'))
  return c.json({ data: toCreditCardProfileDto(profile) }, 201)
})

creditCardsRoutes.patch('/:id', zValidator('json', updateCreditCardProfileSchema), async (c) => {
  const profile = await makeUpdateCreditCardProfile({
    accountRepo: container.accountRepo,
    creditCardProfileRepo: container.creditCardProfileRepo,
  })(c.get('financialSpaceId'), c.req.param('id'), c.req.valid('json'))
  return c.json({ data: toCreditCardProfileDto(profile) })
})

export { creditCardsRoutes }
