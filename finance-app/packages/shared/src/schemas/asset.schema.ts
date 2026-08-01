import { z } from 'zod'
import { ASSET_TYPES, VALIDATION_LIMITS } from '../constants'

export const createAssetSchema = z.object({
  name: z.string().trim().min(1).max(VALIDATION_LIMITS.NAME_MAX),
  type: z.enum(ASSET_TYPES),
  currentValue: z.number().nonnegative('El valor actual no puede ser negativo'),
  notes: z.string().trim().max(1000).optional(),
})
export type CreateAssetInput = z.infer<typeof createAssetSchema>

export const createAssetValuationSchema = z.object({
  value: z.number().nonnegative('El valor no puede ser negativo'),
  date: z.coerce.date(),
  notes: z.string().trim().max(1000).optional(),
})
export type CreateAssetValuationInput = z.infer<typeof createAssetValuationSchema>
