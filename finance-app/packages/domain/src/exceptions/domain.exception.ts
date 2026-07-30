/**
 * Base class for all domain-level exceptions.
 * The API layer maps these to HTTP status codes via the `code` field.
 */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'DomainException'
  }
}
