import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants/defaults'

/**
 * Savings goal validation schemas.
 */

export const createGoalSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX),
  targetAmount: z.number().positive('La meta debe ser positiva'),
  deadline: z.coerce.date().optional(),
})
export type CreateGoalInput = z.infer<typeof createGoalSchema>

export const updateGoalSchema = createGoalSchema.partial()
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>

export const contributeGoalSchema = z.object({
  amount: z.number().positive('La contribución debe ser positiva'),
  accountId: z.string().min(1, 'La cuenta es requerida'),
})
export type ContributeGoalInput = z.infer<typeof contributeGoalSchema>
