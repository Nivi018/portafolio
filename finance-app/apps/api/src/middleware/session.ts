import type { Session } from '@finance/infrastructure'
import { FinancialSpace, FinancialSpaceMember } from '@finance/domain'
import type { FinancialSpaceMemberRole } from '@finance/shared'
import type { MiddlewareHandler } from 'hono'
import { container } from '../lib/container'

declare module 'hono' {
  interface ContextVariableMap {
    session: Session
    userId: string
    financialSpaceId: string
    role: FinancialSpaceMemberRole
  }
}

async function resolveFinancialSpace(userId: string, requestedSpaceId?: string) {
  if (requestedSpaceId) {
    const membership = await container.financialSpaceMemberRepo.findByFinancialSpaceIdAndUserId(
      requestedSpaceId,
      userId,
    )
    if (!membership) return null
    return { financialSpaceId: requestedSpaceId, role: membership.role }
  }

  const spaces = await container.financialSpaceRepo.findByUserId(userId)

  for (const space of spaces) {
    if (space.type !== 'PERSONAL') continue
    const membership = await container.financialSpaceMemberRepo.findByFinancialSpaceIdAndUserId(
      space.id,
      userId
    )
    if (membership?.role === 'OWNER') return { financialSpaceId: space.id, role: membership.role }
  }

  const financialSpace = await container.financialSpaceRepo.create(
    FinancialSpace.create({ name: 'Personal', type: 'PERSONAL' }),
  )
  const membership = await container.financialSpaceMemberRepo.create(
    FinancialSpaceMember.create({ financialSpaceId: financialSpace.id, userId, role: 'OWNER' })
  )

  return { financialSpaceId: financialSpace.id, role: membership.role }
}

/** Requires a valid session and resolves the user's personal financial-space context. */
export const requireSession: MiddlewareHandler = async (c, next) => {
  const session = await container.auth.api.getSession({ headers: c.req.raw.headers })

  if (!session?.user) {
    return c.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, 401)
  }

  c.set('session', session)
  c.set('userId', session.user.id)
  const financialSpace = await resolveFinancialSpace(
    session.user.id,
    c.req.header('x-financial-space-id'),
  )
  if (!financialSpace) {
    return c.json({ error: 'No tienes acceso a este espacio financiero', code: 'FORBIDDEN' }, 403)
  }
  c.set('financialSpaceId', financialSpace.financialSpaceId)
  c.set('role', financialSpace.role)
  if (financialSpace.role === 'VIEWER' && !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    return c.json({ error: 'Tu acceso es solo de lectura', code: 'FORBIDDEN' }, 403)
  }
  return await next()
}
