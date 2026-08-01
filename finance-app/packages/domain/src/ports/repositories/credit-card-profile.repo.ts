import type { CreditCardProfile } from '../../entities'

/** Port for the one-to-one profile that carries a CREDIT account's terms. */
export interface ICreditCardProfileRepository {
  findById(id: string): Promise<CreditCardProfile | null>
  findByAccountId(accountId: string): Promise<CreditCardProfile | null>
  findByFinancialSpaceId(financialSpaceId: string): Promise<CreditCardProfile[]>
  create(profile: CreditCardProfile): Promise<CreditCardProfile>
  update(profile: CreditCardProfile): Promise<CreditCardProfile>
}
