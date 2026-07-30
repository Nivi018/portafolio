import { z } from 'zod'
import { CATEGORY_TYPES } from '../constants/enums'
import { VALIDATION_LIMITS } from '../constants/defaults'

/**
 * Category validation schemas.
 */

export const createCategorySchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX),
  icon: z.string().max(50).default('wallet'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color debe ser hex válido (#rrggbb)')
    .default('#38bdf8'),
  type: z.enum(CATEGORY_TYPES),
})
export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = createCategorySchema.partial()
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
