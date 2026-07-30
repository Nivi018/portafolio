import { makeCreateDefaultCategories } from '@finance/domain'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toUserDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const authRoutes = new Hono()

authRoutes.get('/me', requireSession, async (c) => {
  const user = await container.authService.getUserById(c.get('userId'))
  if (!user) return c.json({ error: 'Usuario no encontrado', code: 'NOT_FOUND' }, 404)
  return c.json({ data: toUserDto(user) })
})

/** Safe to call after registration or login; category seeding is idempotent. */
authRoutes.post('/bootstrap', requireSession, async (c) => {
  const categories = await makeCreateDefaultCategories({
    categoryRepo: container.categoryRepo,
  })(c.get('userId'))

  return c.json({ data: { createdCategories: categories.length } })
})

// Better Auth owns its own endpoints: /sign-in/email, /sign-up/email, /sign-out, etc.
authRoutes.on(['GET', 'POST'], '/*', (c) => container.auth.handler(c.req.raw))

export { authRoutes }
