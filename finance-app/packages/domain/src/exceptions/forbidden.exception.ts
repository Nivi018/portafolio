import { DomainException } from './domain.exception'

/**
 * Thrown when a user tries to access or modify a resource they don't own.
 */
export class ForbiddenException extends DomainException {
  constructor(message = 'Acceso denegado') {
    super(message, 'FORBIDDEN')
    this.name = 'ForbiddenException'
  }
}
