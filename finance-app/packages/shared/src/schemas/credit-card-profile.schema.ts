import { z } from 'zod'

/** Credit card terms are stored separately from the account balance. */
export const createCreditCardProfileSchema = z.object({
  accountId: z.string().min(1),
  bank: z.string().trim().min(1).max(120),
  product: z.string().trim().min(1).max(120),
  creditLimit: z.number().positive('El limite de credito debe ser positivo'),
  apr: z.number().min(0, 'La tasa APR no puede ser negativa'),
  statementCloseDay: z.number().int().min(1).max(31),
  paymentDueDay: z.number().int().min(1).max(31),
})
export type CreateCreditCardProfileInput = z.infer<typeof createCreditCardProfileSchema>

export const updateCreditCardProfileSchema = createCreditCardProfileSchema
  .omit({ accountId: true })
  .partial()
export type UpdateCreditCardProfileInput = z.infer<typeof updateCreditCardProfileSchema>
