import {
  createBudgetSchema,
  updateBudgetSchema,
} from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import {
  makeCreateBudget,
  makeDeleteBudget,
  makeGetBudgetStatuses,
  makeUpdateBudget,
} from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toBudgetDto, toBudgetStatusDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const budgetsRoutes = new Hono().use('*', requireSession)

budgetsRoutes.get('/', async (c) => {
  const result = await makeGetBudgetStatuses({
    budgetRepo: container.budgetRepo,
    transactionRepo: container.transactionRepo,
  })(c.get('financialSpaceId'))

  return c.json({
    data: await Promise.all(
      result.map(async ({ budget, status }) =>
        toBudgetStatusDto(
          budget,
          status,
          budget.categoryId ? await container.categoryRepo.findById(budget.categoryId) : null
        )
      )
    ),
  })
})

budgetsRoutes.post('/', zValidator('json', createBudgetSchema), async (c) => {
  const budget = await makeCreateBudget({
    budgetRepo: container.budgetRepo,
    categoryRepo: container.categoryRepo,
  })(c.get('financialSpaceId'), c.req.valid('json'))

  const category = budget.categoryId ? await container.categoryRepo.findById(budget.categoryId) : null
  return c.json({ data: toBudgetDto(budget, category) }, 201)
})

budgetsRoutes.patch('/:id', zValidator('json', updateBudgetSchema), async (c) => {
  const budget = await makeUpdateBudget({ budgetRepo: container.budgetRepo })(
    c.get('financialSpaceId'),
    c.req.param('id'),
    c.req.valid('json')
  )
  const category = budget.categoryId ? await container.categoryRepo.findById(budget.categoryId) : null
  return c.json({ data: toBudgetDto(budget, category) })
})

budgetsRoutes.delete('/:id', async (c) => {
  await makeDeleteBudget({ budgetRepo: container.budgetRepo })(c.get('financialSpaceId'), c.req.param('id'))
  return c.body(null, 204)
})

export { budgetsRoutes }
