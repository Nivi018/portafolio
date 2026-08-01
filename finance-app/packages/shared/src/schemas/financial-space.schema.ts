import { z } from 'zod'

export const createFinancialSpaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

export const createFinancialSpaceMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['EDITOR', 'VIEWER']),
})

export const updateFinancialSpaceMemberSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER']),
})
