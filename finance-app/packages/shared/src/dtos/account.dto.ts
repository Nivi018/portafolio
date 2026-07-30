import type { AccountType, Currency } from '../types/enums'

/**
 * Finance account DTOs.
 */

export interface AccountDto {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: Currency
  createdAt: string
  updatedAt: string
}

/** Lightweight shape embedded in other DTOs. */
export interface AccountSummaryDto {
  id: string
  name: string
  type: AccountType
}

export interface AccountWithStatsDto extends AccountDto {
  transactionCount: number
  monthlyIncome: number
  monthlyExpense: number
}
