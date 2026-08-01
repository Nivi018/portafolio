import type { CreateCreditCardProfileInput } from '@finance/shared'
import { CreditCardProfile } from '../../entities'
import { NotFoundException, ValidationException } from '../../exceptions'
import type { IAccountRepository, ICreditCardProfileRepository } from '../../ports'

export interface CreateCreditCardProfileDeps {
  accountRepo: IAccountRepository
  creditCardProfileRepo: ICreditCardProfileRepository
}

export function makeCreateCreditCardProfile(deps: CreateCreditCardProfileDeps) {
  return async (financialSpaceId: string, input: CreateCreditCardProfileInput): Promise<CreditCardProfile> => {
    const account = await deps.accountRepo.findById(input.accountId)
    if (!account || account.financialSpaceId !== financialSpaceId || !account.isCredit()) throw new NotFoundException('Credit account')
    if (await deps.creditCardProfileRepo.findByAccountId(input.accountId)) throw new ValidationException('La cuenta ya tiene un perfil de tarjeta de credito')
    return deps.creditCardProfileRepo.create(CreditCardProfile.create(input))
  }
}
