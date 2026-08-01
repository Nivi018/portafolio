import { beforeEach, describe, expect, it } from 'vitest'
import { Account, CreditCardProfile } from '../../entities'
import { NotFoundException, ValidationException } from '../../exceptions'
import { makeInMemoryDeps } from '../../test/in-memory-repos'
import { makeCreateCreditCardProfile } from './create-credit-card-profile'
import { makeGetCreditCardSummaries } from './get-credit-card-summaries'
import { makeUpdateCreditCardProfile } from './update-credit-card-profile'

const FINANCIAL_SPACE_ID = 'space-1'

describe('credit card profiles', () => {
  let deps: ReturnType<typeof makeInMemoryDeps>

  beforeEach(() => {
    deps = makeInMemoryDeps()
  })

  function addCreditAccount(balance = 0) {
    const account = Account.create({ name: 'Card', type: 'CREDIT', balance, currency: 'MXN', financialSpaceId: FINANCIAL_SPACE_ID })
    deps.accountRepo.items.push(account)
    return account
  }

  const terms = (accountId: string) => ({ accountId, bank: 'Banco', product: 'Platinum', creditLimit: 1000, apr: 42.5, statementCloseDay: 15, paymentDueDay: 25 })

  it('validates card terms and calendar days', () => {
    expect(() => CreditCardProfile.create({ ...terms('account'), creditLimit: 0 })).toThrow(ValidationException)
    expect(() => CreditCardProfile.create({ ...terms('account'), statementCloseDay: 32 })).toThrow(ValidationException)
  })

  it('creates only one profile for an owned CREDIT account', async () => {
    const account = addCreditAccount()
    const create = makeCreateCreditCardProfile(deps)
    const profile = await create(FINANCIAL_SPACE_ID, terms(account.id))

    expect(profile.accountId).toBe(account.id)
    await expect(create(FINANCIAL_SPACE_ID, terms(account.id))).rejects.toThrow(ValidationException)
  })

  it('rejects a profile for an account outside the financial space or not credit', async () => {
    const other = Account.create({ name: 'Other', type: 'CREDIT', currency: 'MXN', financialSpaceId: 'other-space' })
    const checking = Account.create({ name: 'Checking', type: 'CHECKING', currency: 'MXN', financialSpaceId: FINANCIAL_SPACE_ID })
    deps.accountRepo.items.push(other, checking)
    const create = makeCreateCreditCardProfile(deps)

    await expect(create(FINANCIAL_SPACE_ID, terms(other.id))).rejects.toThrow(NotFoundException)
    await expect(create(FINANCIAL_SPACE_ID, terms(checking.id))).rejects.toThrow(NotFoundException)
  })

  it('updates profile terms only when its account belongs to the financial space', async () => {
    const account = addCreditAccount()
    const profile = await makeCreateCreditCardProfile(deps)(FINANCIAL_SPACE_ID, terms(account.id))

    await makeUpdateCreditCardProfile(deps)(FINANCIAL_SPACE_ID, profile.id, { apr: 39.9 })
    expect(profile.apr).toBe(39.9)
    await expect(makeUpdateCreditCardProfile(deps)('other-space', profile.id, { apr: 20 })).rejects.toThrow(NotFoundException)
  })

  it.each([
    [-200, 20, 'NONE', 800],
    [-300, 30, 'ATTENTION', 700],
    [-700, 70, 'HIGH', 300],
    [-1200, 120, 'OVER_LIMIT', 0],
  ])('calculates debt, availability, and %s utilization alert', async (balance, utilization, alert, availableCredit) => {
    const account = addCreditAccount(balance)
    await makeCreateCreditCardProfile(deps)(FINANCIAL_SPACE_ID, terms(account.id))

    const [summary] = await makeGetCreditCardSummaries(deps)(FINANCIAL_SPACE_ID)
    expect(summary).toMatchObject({ debt: Math.max(0, -balance), utilization, utilizationAlert: alert, availableCredit })
  })
})
