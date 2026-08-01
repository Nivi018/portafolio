import type { UpdateCreditCardProfileInput } from '@finance/shared'
import type { CreditCardProfile } from '../../entities'
import { NotFoundException } from '../../exceptions'
import type { IAccountRepository, ICreditCardProfileRepository } from '../../ports'

export interface UpdateCreditCardProfileDeps {
  accountRepo: IAccountRepository
  creditCardProfileRepo: ICreditCardProfileRepository
}

export function makeUpdateCreditCardProfile(deps: UpdateCreditCardProfileDeps) {
  return async (financialSpaceId: string, profileId: string, input: UpdateCreditCardProfileInput): Promise<CreditCardProfile> => {
    const profile = await deps.creditCardProfileRepo.findById(profileId)
    const account = profile && await deps.accountRepo.findById(profile.accountId)
    if (!profile || !account || account.financialSpaceId !== financialSpaceId || !account.isCredit()) throw new NotFoundException('Credit card profile')
    profile.update(input)
    return deps.creditCardProfileRepo.update(profile)
  }
}
