import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, changePasswordSchema } from './auth.schema'

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'José Díaz',
      email: 'jose@example.com',
      password: 'securepass123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'José Díaz',
      email: 'not-an-email',
      password: 'securepass123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      name: 'José Díaz',
      email: 'jose@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'jose@example.com',
      password: 'anything',
    })
    expect(result.success).toBe(true)
  })
})

describe('changePasswordSchema', () => {
  it('rejects mismatched confirmation', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old',
      newPassword: 'newpassword123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('confirmPassword')
    }
  })

  it('accepts matching passwords', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    })
    expect(result.success).toBe(true)
  })
})
