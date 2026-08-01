import type { CreditCardProfile, ICreditCardProfileRepository } from '@finance/domain'
import type { PrismaClient } from '../client'
import { toDomainCreditCardProfile } from '../mapper'

export class PrismaCreditCardProfileRepository
  implements ICreditCardProfileRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<CreditCardProfile | null> {
    const row = await this.prisma.creditCardProfile.findUnique({ where: { id } })
    return row ? toDomainCreditCardProfile(row) : null
  }

  async findByAccountId(accountId: string): Promise<CreditCardProfile | null> {
    const row = await this.prisma.creditCardProfile.findUnique({
      where: { accountId },
    })
    return row ? toDomainCreditCardProfile(row) : null
  }

  async findByFinancialSpaceId(
    financialSpaceId: string,
  ): Promise<CreditCardProfile[]> {
    const rows = await this.prisma.creditCardProfile.findMany({
      where: { account: { financialSpaceId } },
      orderBy: { createdAt: "asc" },
    })
    return rows.map(toDomainCreditCardProfile)
  }

  async create(profile: CreditCardProfile): Promise<CreditCardProfile> {
    const row = await this.prisma.creditCardProfile.create({
      data: {
        id: profile.id,
        accountId: profile.accountId,
        bank: profile.bank,
        product: profile.product,
        creditLimit: profile.creditLimit,
        apr: profile.apr,
        statementCloseDay: profile.statementCloseDay,
        paymentDueDay: profile.paymentDueDay,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    })
    return toDomainCreditCardProfile(row)
  }

  async update(profile: CreditCardProfile): Promise<CreditCardProfile> {
    const row = await this.prisma.creditCardProfile.update({
      where: { id: profile.id },
      data: {
        bank: profile.bank,
        product: profile.product,
        creditLimit: profile.creditLimit,
        apr: profile.apr,
        statementCloseDay: profile.statementCloseDay,
        paymentDueDay: profile.paymentDueDay,
        updatedAt: profile.updatedAt,
      },
    })
    return toDomainCreditCardProfile(row)
  }
}
