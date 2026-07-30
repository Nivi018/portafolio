import { DomainException, ForbiddenException, NotFoundException, ValidationException } from '@finance/domain'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class AppError extends Error {
  constructor(
    public statusCode: ContentfulStatusCode,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export async function errorHandler(err: Error, c: Context) {
  console.error(`[ERROR] ${err.message}`)

  if (err instanceof NotFoundException) {
    return c.json({ error: err.message, code: err.code }, 404)
  }

  if (err instanceof ForbiddenException) {
    return c.json({ error: err.message, code: err.code }, 403)
  }

  if (err instanceof ValidationException) {
    return c.json({ error: err.message, code: err.code }, 422)
  }

  if (err instanceof DomainException) {
    return c.json({ error: err.message, code: err.code }, 400)
  }

  if (err instanceof AppError) {
    return c.json({ error: err.message, code: err.code }, err.statusCode)
  }

  return c.json({ error: 'Internal Server Error' }, 500)
}
