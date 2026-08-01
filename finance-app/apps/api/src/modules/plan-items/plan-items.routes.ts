import {
  createPlanItemSchema,
  updatePlanItemSchema,
} from '@finance/shared'
import {
  makeCreatePlanItem,
  makeDeletePlanItem,
  makeGetPlanItems,
  makeUpdatePlanItem,
} from '@finance/domain'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toPlanItemDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const planItemsRoutes = new Hono().use('*', requireSession)

planItemsRoutes.get('/', async (c) => {
  const items = await makeGetPlanItems({ planItemRepo: container.planItemRepo })(
    c.get('financialSpaceId'),
  )
  return c.json({ data: items.map(toPlanItemDto) })
})

planItemsRoutes.post('/', zValidator('json', createPlanItemSchema), async (c) => {
  const item = await makeCreatePlanItem({
    planItemRepo: container.planItemRepo,
    accountRepo: container.accountRepo,
    categoryRepo: container.categoryRepo,
  })(c.get('financialSpaceId'), c.req.valid('json'))
  return c.json({ data: toPlanItemDto(item) }, 201)
})

planItemsRoutes.patch('/:id', zValidator('json', updatePlanItemSchema), async (c) => {
  const item = await makeUpdatePlanItem({
    planItemRepo: container.planItemRepo,
    accountRepo: container.accountRepo,
    categoryRepo: container.categoryRepo,
  })(c.get('financialSpaceId'), c.req.param('id'), c.req.valid('json'))
  return c.json({ data: toPlanItemDto(item) })
})

planItemsRoutes.delete('/:id', async (c) => {
  await makeDeletePlanItem({ planItemRepo: container.planItemRepo })(
    c.get('financialSpaceId'),
    c.req.param('id'),
  )
  return c.body(null, 204)
})

export { planItemsRoutes }
