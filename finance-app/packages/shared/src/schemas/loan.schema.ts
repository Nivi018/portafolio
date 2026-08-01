import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants/defaults'

export const createLoanSchema = z.object({
  lender: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX),
  name: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX),
  originalPrincipal: z.number().positive('El capital original debe ser positivo'),
  annualRate: z.number().nonnegative('La tasa anual no puede ser negativa'),
  termMonths: z.number().int().positive('El plazo debe ser positivo'),
  monthlyPayment: z.number().positive('El pago mensual debe ser positivo'),
  startDate: z.coerce.date(),
  nextPaymentDate: z.coerce.date(),
}).refine((data) => data.nextPaymentDate >= data.startDate, {
  message: 'La próxima fecha de pago no puede ser anterior a la fecha de inicio',
  path: ['nextPaymentDate'],
})
export type CreateLoanInput = z.infer<typeof createLoanSchema>

export const recordLoanPaymentSchema = z.object({
  amount: z.number().positive('El pago debe ser positivo'),
  date: z.coerce.date(),
  accountId: z.string().min(1, 'La cuenta es requerida'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
})
export type RecordLoanPaymentInput = z.infer<typeof recordLoanPaymentSchema>
