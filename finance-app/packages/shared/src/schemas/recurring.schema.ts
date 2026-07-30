import { z } from 'zod'
import { RECURRENCE_FREQUENCIES, TRANSACTION_TYPES } from '../constants/enums'
import { VALIDATION_LIMITS } from '../constants/defaults'

/**
 * Recurring transaction validation schemas.
 */

export const createRecurringSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).optional(),
  type: z.enum(TRANSACTION_TYPES).refine((t) => t !== 'TRANSFER', {
    message: 'Las transferencias no pueden ser recurrentes',
  }),
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  nextDueDate: z.coerce.date(),
  categoryId: z.string().min(1),
  accountId: z.string().min(1),
})
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>

export const updateRecurringSchema = createRecurringSchema.partial()
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>
