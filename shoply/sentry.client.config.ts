import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    debug: false,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === "production",
    integrations: [],
    beforeSend(event) {
      // Don't send events in development
      if (process.env.NODE_ENV !== "production") return null
      return event
    },
  })
}

export { Sentry }

export async function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) {
    console.error("[Sentry stub]", error, context)
    return
  }
  Sentry.captureException(error, { extra: context })
}

export async function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  if (!SENTRY_DSN) {
    console.log(`[Sentry stub] ${level}: ${message}`)
    return
  }
  Sentry.captureMessage(message, level)
}
