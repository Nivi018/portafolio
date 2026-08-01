import { createLoanSchema, recordLoanPaymentSchema } from '@finance/shared'
import {
  makeCreateLoan,
  makeGetLoans,
  makeRecordLoanPayment,
} from '@finance/domain'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toLoanDto, toLoanPaymentDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const loansRoutes = new Hono().use('*', requireSession)

loansRoutes.get('/', async (c) => {
  const loans = await makeGetLoans({ loanRepo: container.loanRepo })(c.get('financialSpaceId'))
  return c.json({ data: loans.map(toLoanDto) })
})

loansRoutes.post('/', zValidator('json', createLoanSchema), async (c) => {
  const loan = await makeCreateLoan({ loanRepo: container.loanRepo })(
    c.get('financialSpaceId'),
    c.req.valid('json'),
  )
  return c.json({ data: toLoanDto(loan) }, 201)
})

loansRoutes.get('/:id/payments', async (c) => {
  const loan = await container.loanRepo.findById(c.req.param('id'))
  if (!loan || loan.financialSpaceId !== c.get('financialSpaceId')) {
    return c.json({ error: 'Préstamo no encontrado', code: 'NOT_FOUND' }, 404)
  }
  const payments = await container.loanRepo.findPaymentsByLoanId(loan.id)
  return c.json({ data: payments.map(toLoanPaymentDto) })
})

loansRoutes.post('/:id/payments', zValidator('json', recordLoanPaymentSchema), async (c) => {
  const result = await makeRecordLoanPayment({
    loanRepo: container.loanRepo,
    transactionRepo: container.transactionRepo,
    accountRepo: container.accountRepo,
    categoryRepo: container.categoryRepo,
  })(c.get('financialSpaceId'), c.req.param('id'), c.req.valid('json'))
  return c.json({ data: { loan: toLoanDto(result.loan), payment: toLoanPaymentDto(result.payment) } }, 201)
})

export { loansRoutes }
