import { FinancialSpace, FinancialSpaceMember, makeCreateDefaultCategories } from '@finance/domain'
import {
  createFinancialSpaceMemberSchema,
  createFinancialSpaceSchema,
  updateFinancialSpaceMemberSchema,
} from '@finance/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { requireSession } from '../../middleware/session'

const financialSpacesRoutes = new Hono().use('*', requireSession)

financialSpacesRoutes.get('/', async (c) => {
  const spaces = await container.financialSpaceRepo.findByUserId(c.get('userId'))
  const memberships = await Promise.all(
    spaces.map(async (space) => ({
      space,
      membership: await container.financialSpaceMemberRepo.findByFinancialSpaceIdAndUserId(
        space.id,
        c.get('userId'),
      ),
    })),
  )

  return c.json({
    data: memberships.flatMap(({ space, membership }) =>
      membership
        ? [{ id: space.id, name: space.name, type: space.type, role: membership.role }]
        : [],
    ),
  })
})

financialSpacesRoutes.post('/', zValidator('json', createFinancialSpaceSchema), async (c) => {
  const financialSpace = await container.financialSpaceRepo.create(
    FinancialSpace.create({ name: c.req.valid('json').name, type: 'HOUSEHOLD' }),
  )
  const membership = await container.financialSpaceMemberRepo.create(
    FinancialSpaceMember.create({
      financialSpaceId: financialSpace.id,
      userId: c.get('userId'),
      role: 'OWNER',
    }),
  )
  await makeCreateDefaultCategories({ categoryRepo: container.categoryRepo })(financialSpace.id)

  return c.json(
    {
      data: {
        id: financialSpace.id,
        name: financialSpace.name,
        type: financialSpace.type,
        role: membership.role,
      },
    },
    201,
  )
})

financialSpacesRoutes.get('/:id/members', async (c) => {
  const membership = await container.financialSpaceMemberRepo.findByFinancialSpaceIdAndUserId(
    c.req.param('id'),
    c.get('userId'),
  )
  if (!membership) return c.json({ error: 'No tienes acceso a este espacio financiero' }, 403)

  const members = await container.prisma.financialSpaceMember.findMany({
    where: { financialSpaceId: c.req.param('id') },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return c.json({
    data: members.map((member) => ({
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
    })),
  })
})

financialSpacesRoutes.post(
  '/:id/members',
  zValidator('json', createFinancialSpaceMemberSchema),
  async (c) => {
    const spaceId = c.req.param('id')
    const actor = await container.financialSpaceMemberRepo.findByFinancialSpaceIdAndUserId(
      spaceId,
      c.get('userId'),
    )
    if (actor?.role !== 'OWNER') return c.json({ error: 'Solo el propietario puede administrar miembros' }, 403)

    const input = c.req.valid('json')
    const user = await container.prisma.user.findUnique({ where: { email: input.email } })
    if (!user) return c.json({ error: 'La persona debe registrarse antes de unirse al hogar' }, 404)
    const existingMember = await container.financialSpaceMemberRepo.findByFinancialSpaceIdAndUserId(
      spaceId,
      user.id,
    )
    if (existingMember) return c.json({ error: 'La persona ya pertenece a este espacio' }, 409)

    const member = await container.financialSpaceMemberRepo.create(
      FinancialSpaceMember.create({ financialSpaceId: spaceId, userId: user.id, role: input.role }),
    )
    return c.json({ data: { userId: member.userId, role: member.role } }, 201)
  },
)

financialSpacesRoutes.patch(
  '/:id/members/:userId',
  zValidator('json', updateFinancialSpaceMemberSchema),
  async (c) => {
    const spaceId = c.req.param('id')
    const actor = await container.financialSpaceMemberRepo.findByFinancialSpaceIdAndUserId(
      spaceId,
      c.get('userId'),
    )
    if (actor?.role !== 'OWNER') return c.json({ error: 'Solo el propietario puede administrar miembros' }, 403)
    const target = await container.financialSpaceMemberRepo.findByFinancialSpaceIdAndUserId(
      spaceId,
      c.req.param('userId'),
    )
    if (!target) return c.json({ error: 'Miembro no encontrado' }, 404)
    if (target.role === 'OWNER') return c.json({ error: 'No puedes cambiar el rol del propietario' }, 400)

    const updated = await container.prisma.financialSpaceMember.update({
      where: { financialSpaceId_userId: { financialSpaceId: spaceId, userId: target.userId } },
      data: { role: c.req.valid('json').role },
    })
    return c.json({ data: { userId: updated.userId, role: updated.role } })
  },
)

financialSpacesRoutes.delete('/:id/members/:userId', async (c) => {
  const spaceId = c.req.param('id')
  const actor = await container.financialSpaceMemberRepo.findByFinancialSpaceIdAndUserId(
    spaceId,
    c.get('userId'),
  )
  if (actor?.role !== 'OWNER') return c.json({ error: 'Solo el propietario puede administrar miembros' }, 403)
  if (c.req.param('userId') === c.get('userId')) {
    return c.json({ error: 'El propietario no puede eliminarse a sí mismo' }, 400)
  }
  await container.financialSpaceMemberRepo.delete(spaceId, c.req.param('userId'))
  return c.body(null, 204)
})

export { financialSpacesRoutes }
