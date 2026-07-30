import { DomainException } from './domain.exception'

export class InsufficientFundsException extends DomainException {
  constructor(accountName?: string) {
    super(
      `Fondos insuficientes${accountName ? ` en la cuenta "${accountName}"` : ''}`,
      'INSUFFICIENT_FUNDS'
    )
    this.name = 'InsufficientFundsException'
  }
}
