import { makeGetNetWorth } from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { requireSession } from '../../middleware/session'

const metricsRoutes = new Hono().use('*', requireSession)
metricsRoutes.get('/net-worth', async (c) => c.json({ data: await makeGetNetWorth(container)(c.get('financialSpaceId')) }))
export { metricsRoutes }
