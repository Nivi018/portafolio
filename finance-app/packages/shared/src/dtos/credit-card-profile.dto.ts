import type { CreditUtilizationAlert, Currency } from '../types/enums'

/** Persisted credit-card terms associated with one CREDIT account. */
export interface CreditCardProfileDto {
  id: string
  accountId: string
  bank: string
  product: string
  creditLimit: number
  apr: number
  statementCloseDay: number
  paymentDueDay: number
  createdAt: string
  updatedAt: string
}

/** Current card position derived from its profile and account balance. */
export interface CreditCardSummaryDto extends CreditCardProfileDto {
  accountName: string
  currency: Currency
  balance: number
  debt: number
  utilization: number
  availableCredit: number
  utilizationAlert: CreditUtilizationAlert
}
