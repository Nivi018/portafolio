import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import type { PrismaClient } from "../database/client"

export interface AuthConfig {
  secret: string
  baseURL: string
  /** Optional OAuth providers (only enabled when credentials are present) */
  google?: { clientId: string; clientSecret: string }
}

/**
 * Creates the Better Auth instance wired to our Prisma client.
 *
 * - Email/password enabled (min 8 chars)
 * - Sessions expire after 7 days, refreshed daily
 * - Optional Google OAuth via env config
 *
 * The Hono app mounts `auth.handler` and reads sessions via `auth.api.getSession`.
 */
export function createAuth(prisma: PrismaClient, config: AuthConfig) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: [config.baseURL],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh once per day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 min cookie cache
      },
    },
    socialProviders: config.google
      ? {
          google: {
            clientId: config.google.clientId,
            clientSecret: config.google.clientSecret,
          },
        }
      : {},
    advanced: {
      cookiePrefix: "finance-app",
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
export type Session = Auth["$Infer"]["Session"]
