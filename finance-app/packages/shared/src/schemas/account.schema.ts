import { z } from 'zod'
import { ACCOUNT_TYPES, CURRENCIES } from '../constants/enums'
import { VALIDATION_LIMITS, DEFAULT_CURRENCY } from '../constants/defaults'

/**
 * Finance account (bank account, wallet, credit card) validation schemas.
 */

export const createAccountSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX),
  type: z.enum(ACCOUNT_TYPES),
  balance: z.number().default(0),
  currency: z.enum(CURRENCIES).default(DEFAULT_CURRENCY),
})
export type CreateAccountInput = z.infer<typeof createAccountSchema>

export const updateAccountSchema = createAccountSchema.partial().omit({ balance: true })
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>

/**
 * Transfer between two accounts of the same user.
 */
export const transferFundsSchema = z
  .object({
    fromAccountId: z.string().min(1),
    toAccountId: z.string().min(1),
    amount: z.number().positive('El monto debe ser positivo'),
    description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).optional(),
    date: z.coerce.date().default(() => new Date()),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'No puedes transferir a la misma cuenta',
    path: ['toAccountId'],
  })
export type TransferFundsInput = z.infer<typeof transferFundsSchema>
