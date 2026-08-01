import { simulateCredit } from '@finance/domain'
import { creditSimulatorSchema } from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { requireSession } from '../../middleware/session'

const creditSimulatorRoutes = new Hono().use('*', requireSession)

creditSimulatorRoutes.post('/', zValidator('json', creditSimulatorSchema), (c) => {
  return c.json({ data: simulateCredit(c.req.valid('json')) })
})

export { creditSimulatorRoutes }
