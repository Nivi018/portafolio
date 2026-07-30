import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants/defaults'

/**
 * Auth-related validation schemas.
 * Note: Better Auth handles most auth flows server-side; these schemas
 * are used for client-side form validation and custom endpoints.
 */

export const registerSchema = z.object({
  name: z.string().min(VALIDATION_LIMITS.NAME_MIN).max(VALIDATION_LIMITS.NAME_MAX),
  email: z.email(),
  password: z.string().min(VALIDATION_LIMITS.PASSWORD_MIN).max(VALIDATION_LIMITS.PASSWORD_MAX),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'La contraseña es requerida'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(VALIDATION_LIMITS.PASSWORD_MIN).max(VALIDATION_LIMITS.PASSWORD_MAX),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const updateProfileSchema = z.object({
  name: z.string().min(VALIDATION_LIMITS.NAME_MIN).max(VALIDATION_LIMITS.NAME_MAX).optional(),
  image: z.url().optional(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
