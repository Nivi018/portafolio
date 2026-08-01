import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants/defaults'

/**
 * Savings goal validation schemas.
 */

export const createGoalSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX),
  targetAmount: z.number().positive('La meta debe ser positiva'),
  deadline: z.coerce.date().optional(),
  expectedAnnualReturn: z.number().nonnegative('El rendimiento esperado no puede ser negativo').default(0),
  monthlyContributionTarget: z.number().nonnegative('El aporte mensual no puede ser negativo').optional(),
})
export type CreateGoalInput = z.infer<typeof createGoalSchema>

export const updateGoalSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX).optional(),
  targetAmount: z.number().positive('La meta debe ser positiva').optional(),
  deadline: z.coerce.date().nullable().optional(),
  expectedAnnualReturn: z.number().nonnegative('El rendimiento esperado no puede ser negativo').optional(),
  monthlyContributionTarget: z.number().nonnegative('El aporte mensual no puede ser negativo').nullable().optional(),
})
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>

export const contributeGoalSchema = z.object({
  amount: z.number().positive('La contribución debe ser positiva'),
  accountId: z.string().min(1, 'La cuenta es requerida'),
})
export type ContributeGoalInput = z.infer<typeof contributeGoalSchema>
