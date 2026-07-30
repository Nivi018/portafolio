import { DomainException } from './domain.exception'

export class NotFoundException extends DomainException {
  constructor(entity: string, id?: string) {
    super(`${entity} no encontrado${id ? `: ${id}` : ''}`, 'NOT_FOUND')
    this.name = 'NotFoundException'
  }
}
