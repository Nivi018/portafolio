import {
  contributeGoalSchema,
  createGoalSchema,
} from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import {
  makeContributeGoal,
  makeCreateGoal,
  makeDeleteGoal,
  makeGetGoals,
} from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toGoalDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const goalsRoutes = new Hono().use('*', requireSession)

goalsRoutes.get('/', async (c) => {
  const goals = await makeGetGoals({ goalRepo: container.goalRepo })(c.get('userId'))
  return c.json({ data: goals.map(toGoalDto) })
})

goalsRoutes.post('/', zValidator('json', createGoalSchema), async (c) => {
  const goal = await makeCreateGoal({ goalRepo: container.goalRepo })(
    c.get('userId'),
    c.req.valid('json')
  )
  return c.json({ data: toGoalDto(goal) }, 201)
})

goalsRoutes.post('/:id/contribute', zValidator('json', contributeGoalSchema), async (c) => {
  const result = await makeContributeGoal({
    goalRepo: container.goalRepo,
    accountRepo: container.accountRepo,
    transactionRepo: container.transactionRepo,
  })(c.get('userId'), c.req.param('id'), c.req.valid('json'))

  return c.json({ data: toGoalDto(result.goal) }, 201)
})

goalsRoutes.delete('/:id', async (c) => {
  await makeDeleteGoal({ goalRepo: container.goalRepo })(c.get('userId'), c.req.param('id'))
  return c.body(null, 204)
})

export { goalsRoutes }
