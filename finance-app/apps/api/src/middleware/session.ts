import type { Session } from '@finance/infrastructure'
import type { MiddlewareHandler } from 'hono'
import { container } from '../lib/container'

declare module 'hono' {
  interface ContextVariableMap {
    session: Session
    userId: string
  }
}

/** Requires a valid Better Auth session and exposes its user id to routes. */
export const requireSession: MiddlewareHandler = async (c, next) => {
  const session = await container.auth.api.getSession({ headers: c.req.raw.headers })

  if (!session?.user) {
    return c.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, 401)
  }

  c.set('session', session)
  c.set('userId', session.user.id)
  return await next()
}
