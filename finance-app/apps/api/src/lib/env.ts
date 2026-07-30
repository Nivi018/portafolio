import { config } from 'dotenv'

// API commands run from apps/api; load the shared monorepo environment file.
config({ path: '../../.env' })

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue
}

export const env = {
  // Database
  DATABASE_URL: required('DATABASE_URL'),

  // Auth
  BETTER_AUTH_SECRET: required('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: optional('BETTER_AUTH_URL', 'http://localhost:3000'),
  GOOGLE_CLIENT_ID: optional('GOOGLE_CLIENT_ID', ''),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET', ''),

  // Server
  PORT: parseInt(optional('PORT', '3001'), 10),
  NODE_ENV: optional('NODE_ENV', 'development'),
  CRON_SECRET: optional('CRON_SECRET', ''),

  // Email (optional)
  RESEND_API_KEY: optional('RESEND_API_KEY', ''),
  RESEND_FROM_EMAIL: optional('RESEND_FROM_EMAIL', 'noreply@financeapp.dev'),
} as const

export type Env = typeof env
