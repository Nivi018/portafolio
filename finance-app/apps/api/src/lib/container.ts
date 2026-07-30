import {
  createAuth,
  getPrismaClient,
  PrismaAccountRepository,
  PrismaAuthService,
  PrismaBudgetRepository,
  PrismaCategoryRepository,
  PrismaGoalRepository,
  PrismaRecurringRepository,
  PrismaTransactionRepository,
  ResendEmailService,
} from '@finance/infrastructure'
import { env } from './env'

/**
 * Composition root. The API is the only layer allowed to combine ports,
 * adapters, and use cases. Domain code receives dependencies explicitly.
 */
const prisma = getPrismaClient()

export const container = {
  prisma,
  auth: createAuth(prisma, {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  }),
  transactionRepo: new PrismaTransactionRepository(prisma),
  accountRepo: new PrismaAccountRepository(prisma),
  categoryRepo: new PrismaCategoryRepository(prisma),
  budgetRepo: new PrismaBudgetRepository(prisma),
  goalRepo: new PrismaGoalRepository(prisma),
  recurringRepo: new PrismaRecurringRepository(prisma),
  authService: new PrismaAuthService(prisma),
  emailService: new ResendEmailService(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL),
}

export type Container = typeof container
