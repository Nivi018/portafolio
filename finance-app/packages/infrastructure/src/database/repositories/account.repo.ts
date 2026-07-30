import type { IAccountRepository, Account } from "@finance/domain"
import type { PrismaClient } from "../client"
import { toDomainAccount } from "../mapper"

export class PrismaAccountRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Account | null> {
    const row = await this.prisma.financeAccount.findUnique({ where: { id } })
    return row ? toDomainAccount(row) : null
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const rows = await this.prisma.financeAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    })
    return rows.map(toDomainAccount)
  }

  async create(account: Account): Promise<Account> {
    const row = await this.prisma.financeAccount.create({
      data: {
        id: account.id,
        userId: account.userId,
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
    })
    return toDomainAccount(row)
  }

  async update(account: Account): Promise<Account> {
    const row = await this.prisma.financeAccount.update({
      where: { id: account.id },
      data: {
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        updatedAt: account.updatedAt,
      },
    })
    return toDomainAccount(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.financeAccount.delete({ where: { id } })
  }

  async hasTransactions(id: string): Promise<boolean> {
    const count = await this.prisma.transaction.count({ where: { accountId: id } })
    return count > 0
  }

  async getTotalBalance(userId: string): Promise<number> {
    const agg = await this.prisma.financeAccount.aggregate({
      where: { userId },
      _sum: { balance: true },
    })
    return agg._sum.balance ?? 0
  }
}
