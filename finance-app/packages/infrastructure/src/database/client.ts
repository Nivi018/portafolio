import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

/**
 * Factory: creates a PrismaClient backed by the pg driver adapter.
 * Accepts an explicit connection string (useful for scripts/tests)
 * or falls back to process.env.DATABASE_URL.
 */
export function createPrismaClient(connectionString?: string): PrismaClient {
  const url = connectionString ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/** Lazy global singleton (avoids exhausting connections on hot reload). */
export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export type { PrismaClient }
