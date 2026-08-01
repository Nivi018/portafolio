import { z } from 'zod'
import { PLAN_ITEM_FREQUENCIES, PLAN_ITEM_TYPES } from '../constants/enums'
import { VALIDATION_LIMITS } from '../constants/defaults'

export const createPlanItemSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(VALIDATION_LIMITS.DESCRIPTION_MAX),
  amount: z.number().positive('El monto debe ser positivo'),
  type: z.enum(PLAN_ITEM_TYPES),
  frequency: z.enum(PLAN_ITEM_FREQUENCIES),
  categoryId: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
  isFixed: z.boolean().default(false),
  isMicroExpense: z.boolean().default(false),
})
export type CreatePlanItemInput = z.infer<typeof createPlanItemSchema>

export const updatePlanItemSchema = createPlanItemSchema.partial()
export type UpdatePlanItemInput = z.infer<typeof updatePlanItemSchema>
