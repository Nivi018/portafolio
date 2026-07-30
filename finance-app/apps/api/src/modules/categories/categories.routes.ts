import { CATEGORY_TYPES, createCategorySchema } from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import {
  makeCreateCategory,
  makeDeleteCategory,
  makeGetCategories,
} from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toCategoryDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const categoriesRoutes = new Hono().use('*', requireSession)

categoriesRoutes.get('/', async (c) => {
  const requestedType = c.req.query('type')
  if (requestedType && !CATEGORY_TYPES.includes(requestedType as (typeof CATEGORY_TYPES)[number])) {
    return c.json({ error: 'Tipo de categoría inválido', code: 'VALIDATION_ERROR' }, 400)
  }

  const categories = await makeGetCategories({ categoryRepo: container.categoryRepo })(
    c.get('userId'),
    requestedType as (typeof CATEGORY_TYPES)[number] | undefined
  )
  return c.json({ data: categories.map(toCategoryDto) })
})

categoriesRoutes.post('/', zValidator('json', createCategorySchema), async (c) => {
  const category = await makeCreateCategory({ categoryRepo: container.categoryRepo })(
    c.get('userId'),
    c.req.valid('json')
  )
  return c.json({ data: toCategoryDto(category) }, 201)
})

categoriesRoutes.delete('/:id', async (c) => {
  await makeDeleteCategory({ categoryRepo: container.categoryRepo })(
    c.get('userId'),
    c.req.param('id')
  )
  return c.body(null, 204)
})

export { categoriesRoutes }
