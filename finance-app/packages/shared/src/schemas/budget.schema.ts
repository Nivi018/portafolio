import { z } from 'zod'
import { BUDGET_PERIODS } from '../constants/enums'

/**
 * Budget validation schemas.
 */

export const createBudgetSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  period: z.enum(BUDGET_PERIODS).default('MONTHLY'),
  categoryId: z.string().min(1).optional(),
  startDate: z.coerce.date().default(() => new Date()),
})
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>

export const updateBudgetSchema = createBudgetSchema.partial()
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
